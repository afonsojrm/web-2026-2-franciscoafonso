import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, Minimize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export const ChatBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Olá! Sou o assistente virtual do PetHub 🐾. Como posso ajudar você e seu pet hoje?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const primaryWsUrl =
    import.meta.env.VITE_CHATBOT_WS_URL ||
    'wss://api.franciscoafonso.zangado.web.ufersa.dev.br/production';
  const directWsUrl =
    'wss://bfi1jnvepa.execute-api.us-east-1.amazonaws.com/production';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gerenciamento da conexão WebSocket com o API Gateway (com fallback automático resiliente)
  useEffect(() => {
    let isSubscribed = true;
    setIsConnecting(true);

    const tryConnect = (targetUrl: string, isFallback = false) => {
      try {
        const socket = new WebSocket(targetUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!isSubscribed) return;
          setIsConnected(true);
          setIsConnecting(false);
        };

        socket.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            const botReply = data.message || data.text || data.data || JSON.stringify(data);
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                sender: 'bot',
                text: botReply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } catch {
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                sender: 'bot',
                text: String(event.data),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        };

        socket.onerror = () => {
          if (!isSubscribed) return;
          if (!isFallback && targetUrl !== directWsUrl) {
            // Tenta fallback direto se a rota customizada ainda estiver propagando DNS
            tryConnect(directWsUrl, true);
          } else {
            setIsConnected(false);
            setIsConnecting(false);
          }
        };

        socket.onclose = () => {
          if (!isSubscribed) return;
          if (!isFallback && !isConnected && targetUrl !== directWsUrl) {
            tryConnect(directWsUrl, true);
          } else {
            setIsConnected(false);
            setIsConnecting(false);
          }
        };
      } catch {
        if (!isFallback && targetUrl !== directWsUrl) {
          tryConnect(directWsUrl, true);
        } else {
          setIsConnected(false);
          setIsConnecting(false);
        }
      }
    };

    tryConnect(primaryWsUrl);

    return () => {
      isSubscribed = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [primaryWsUrl, directWsUrl]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const textToSend = inputText.trim();
    setInputText('');

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Envia no formato compatível com o Route Selection Expression ($request.body.action)
      socketRef.current.send(
        JSON.stringify({
          action: 'sendMessage',
          message: textToSend,
        })
      );
    } else {
      // Resposta simulada de fallback caso a API ainda não esteja deployada
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'bot',
            text: 'Estou operando em modo de pré-visualização. Logo que o deploy da API WebSocket no API Gateway for concluído, responderei em tempo real via nuvem AWS!',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 700);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Botão Flutuante quando fechado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-sky-600 hover:bg-sky-500 text-white px-4 py-3 rounded-full shadow-lg shadow-sky-600/30 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-300"
          title="Falar com o Assistente PetHub"
        >
          <div className="relative">
            <Bot className="w-5 h-5 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="text-sm font-semibold tracking-tight hidden sm:inline">
            Assistente Virtual
          </span>
        </button>
      )}

      {/* Janela do Chatbot quando aberto */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header do Chat */}
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  PetHub Assistente
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-sky-100">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected
                        ? 'bg-emerald-400'
                        : isConnecting
                        ? 'bg-amber-300 animate-pulse'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span>
                    {isConnected
                      ? 'WebSocket Ativo'
                      : isConnecting
                      ? 'Conectando...'
                      : 'Modo Offline / Simulado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Minimizar"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulário de Envio */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite sua dúvida ou mensagem..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 transition-colors shadow-sm"
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
