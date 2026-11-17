import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  Bot,
  Sparkles,
  Minimize2,
  Paperclip,
  FileText,
  ExternalLink,
  FolderOpen,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CHATBOT_API_URL =
  import.meta.env.VITE_CHATBOT_API_URL ||
  'https://pk2rmu0bo5.execute-api.us-east-1.amazonaws.com/Prod/chatbot';

interface ChatAttachment {
  fileName: string;
  contentType: string;
  previewUrl?: string;
  fileUrl?: string;
  s3Key?: string;
  dimensions?: string | null;
  sizeBytes?: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  attachment?: ChatAttachment;
  needsLogin?: boolean;
}

interface PersistedDynamoMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  file?: {
    key: string;
    fileName: string;
    contentType: string;
    processedSizeBytes?: number;
    dimensions?: string | null;
    fileUrl?: string;
  } | null;
}

interface StoredChatbotFile {
  key: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  lastModified: string | null;
  fileUrl: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'bot',
  text: 'Olá! Sou o assistente virtual do PetHub 🐾. Você pode tirar dúvidas ou enviar fotos e documentos (ex: cartão de vacina, receita ou foto do pet) usando o ícone de clipe!',
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const ChatBotWidget = () => {
  const { cognitoToken, getValidCognitoToken, invalidateCognitoToken, loginWithCognito } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);

  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [s3Files, setS3Files] = useState<StoredChatbotFile[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const loadChatbotHistoryAndFiles = useCallback(async () => {
    const validToken = getValidCognitoToken();
    if (!validToken) return;
    setIsLoadingHistory(true);
    try {
      const resp = await fetch(CHATBOT_API_URL, {
        method: 'GET',
        headers: {
          Authorization: validToken,
        },
      });
      if (resp.status === 401) {
        invalidateCognitoToken();
        return;
      }
      if (resp.ok) {
        const data = (await resp.json()) as {
          messages?: PersistedDynamoMessage[];
          files?: StoredChatbotFile[];
        };

        setS3Files(data.files || []);

        if (data.messages && data.messages.length > 0) {
          const hydrated: ChatMessage[] = data.messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            time: new Date(m.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            attachment: m.file
              ? {
                  fileName: m.file.fileName,
                  contentType: m.file.contentType,
                  fileUrl: m.file.fileUrl,
                  previewUrl:
                    m.sender === 'user' && m.file.contentType.startsWith('image/')
                      ? m.file.fileUrl
                      : undefined,
                  s3Key: m.file.key,
                  dimensions: m.file.dimensions,
                  sizeBytes: m.file.processedSizeBytes,
                }
              : undefined,
          }));
          setMessages([WELCOME_MESSAGE, ...hydrated]);
        }
      }
    } catch (err) {
      console.warn('Falha ao carregar histórico do DynamoDB/S3:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getValidCognitoToken, invalidateCognitoToken]);

  useEffect(() => {
    if (cognitoToken) {
      loadChatbotHistoryAndFiles();
    } else {
      setMessages([WELCOME_MESSAGE]);
      setS3Files([]);
    }
  }, [cognitoToken, loadChatbotHistoryAndFiles]);

  const handleToggleFilesPanel = () => {
    const next = !showFilesPanel;
    setShowFilesPanel(next);
    if (next && cognitoToken) {
      loadChatbotHistoryAndFiles();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if ((!textToSend && !selectedFile) || isSending) return;

    const attachmentForBubble: ChatAttachment | undefined = selectedFile
      ? {
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
          previewUrl: filePreviewUrl || undefined,
          sizeBytes: selectedFile.size,
        }
      : undefined;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: textToSend || `Arquivo anexado: ${selectedFile?.name}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: attachmentForBubble,
    };

    const fileToUpload = selectedFile;
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const validToken = getValidCognitoToken();
    if (!validToken) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: 'A rota REST do Chatbot (/chatbot) exige um token JWT válido do Cognito (que expira em 60 min). Entre com sua conta Google para enviar mensagens e arquivos.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          needsLogin: true,
        },
      ]);
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      if (textToSend) {
        formData.append('message', textToSend);
      }
      if (fileToUpload) {
        formData.append('file', fileToUpload);
      }

      const response = await fetch(CHATBOT_API_URL, {
        method: 'POST',
        headers: {
          Authorization: validToken,
        },
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        file?: {
          key?: string;
          fileName?: string;
          contentType?: string;
          processedSizeBytes?: number;
          dimensions?: string | null;
          fileUrl?: string;
        } | null;
      };

      if (response.status === 401) {
        invalidateCognitoToken();
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'bot',
            text: 'Seu token JWT do Cognito expirou ou não foi aceito (401). Clique abaixo para renovar o login com o Google:',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            needsLogin: true,
          },
        ]);
        return;
      }

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'bot',
            text: data.message || `Erro ${response.status} ao enviar mensagem para a API REST.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: data.message || 'Mensagem processada com sucesso!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachment: data.file
            ? {
                fileName: data.file.fileName || 'arquivo',
                contentType: data.file.contentType || 'application/octet-stream',
                fileUrl: data.file.fileUrl,
                s3Key: data.file.key,
                dimensions: data.file.dimensions,
                sizeBytes: data.file.processedSizeBytes,
              }
            : undefined,
        },
      ]);

      if (data.file && showFilesPanel) {
        loadChatbotHistoryAndFiles();
      }
    } catch (err) {
      const isNetworkOrAuthCors =
        err instanceof TypeError && err.message.toLowerCase().includes('fetch');
      if (isNetworkOrAuthCors) {
        invalidateCognitoToken();
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'bot',
          text: isNetworkOrAuthCors
            ? 'Sua sessão do Cognito expirou ou o servidor rejeitou o token. Clique abaixo para renovar seu login com o Google:'
            : err instanceof Error
            ? `Falha de conexão com a API REST (/chatbot): ${err.message}`
            : 'Falha ao enviar para o servidor.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          needsLogin: isNetworkOrAuthCors,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Botão Flutuante quando fechado */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 bg-sky-600 hover:bg-sky-500 text-white px-4 py-3 rounded-full shadow-lg shadow-sky-600/30 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-300 cursor-pointer"
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
        <div className="w-[360px] sm:w-[410px] h-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
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
                      cognitoToken ? 'bg-emerald-400' : 'bg-amber-300'
                    }`}
                  />
                  <span>
                    {cognitoToken ? 'REST API + DynamoDB Ativo' : 'Requer Login Google/Cognito'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cognitoToken && (
                <button
                  type="button"
                  onClick={handleToggleFilesPanel}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    showFilesPanel
                      ? 'bg-white/25 text-white'
                      : 'hover:bg-white/10 text-white/80 hover:text-white'
                  }`}
                  title="Ver arquivos enviados (GET /chatbot)"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white cursor-pointer"
                title="Minimizar"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Painel de Arquivos Salvos no S3 (GET /chatbot) */}
          {showFilesPanel && (
            <div className="bg-slate-100 border-b border-slate-200 p-3 max-h-44 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Arquivos Salvos no S3 (GET /chatbot)</span>
                <button
                  type="button"
                  onClick={loadChatbotHistoryAndFiles}
                  className="text-sky-600 hover:underline cursor-pointer"
                >
                  Atualizar
                </button>
              </div>
              {isLoadingHistory ? (
                <p className="text-[11px] text-slate-500">Carregando anexos...</p>
              ) : s3Files.length === 0 ? (
                <p className="text-[11px] text-slate-500">Nenhum arquivo enviado ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {s3Files.map((f) => (
                    <a
                      key={f.key}
                      href={f.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] hover:border-sky-400 transition-colors"
                    >
                      <span className="truncate font-medium text-slate-700">{f.fileName}</span>
                      <span className="inline-flex items-center gap-1 text-sky-600 shrink-0 font-semibold">
                        {(f.sizeBytes / 1024).toFixed(1)} KB
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Área de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs sm:text-sm">
            {isLoadingHistory && messages.length <= 1 && (
              <div className="text-center text-[11px] text-slate-400 py-1">
                Carregando histórico salvo no DynamoDB...
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-sm space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  {/* Preview de imagem anexada na mensagem do usuário */}
                  {msg.sender === 'user' && msg.attachment?.previewUrl && (
                    <img
                      src={msg.attachment.previewUrl}
                      alt={msg.attachment.fileName}
                      className="max-h-36 rounded-xl border border-white/20 object-cover"
                    />
                  )}

                  {/* Badge de arquivo não-imagem na mensagem do usuário */}
                  {msg.sender === 'user' && msg.attachment && !msg.attachment.previewUrl && (
                    <div className="flex items-center gap-1.5 bg-sky-700/60 px-2.5 py-1.5 rounded-lg text-[11px]">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{msg.attachment.fileName}</span>
                    </div>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Card de arquivo processado e salvo no S3 retornado pelo backend */}
                  {msg.sender === 'bot' && msg.attachment?.fileUrl && (
                    <a
                      href={msg.attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 hover:border-sky-400 rounded-xl px-2.5 py-2 text-[11px] text-slate-700 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">
                          S3: {msg.attachment.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {msg.attachment.dimensions ? `${msg.attachment.dimensions} • ` : ''}
                          {msg.attachment.sizeBytes
                            ? `${(msg.attachment.sizeBytes / 1024).toFixed(1)} KB`
                            : ''}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    </a>
                  )}

                  {msg.needsLogin && (
                    <button
                      type="button"
                      onClick={() => loginWithCognito('Google')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Entrar com o Google</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-start">
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  <span>Processando arquivo e salvando no DynamoDB...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preview do arquivo selecionado antes do envio */}
          {selectedFile && (
            <div className="px-3 py-2 bg-sky-50 border-t border-sky-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt={selectedFile.name}
                    className="w-9 h-9 rounded-lg object-cover border border-sky-200 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Pronto para envio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelectedFile}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Remover anexo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Formulário de Envio */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,text/plain,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-sky-600 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              title="Anexar imagem ou arquivo (PDF/TXT)"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedFile
                  ? 'Pergunte algo sobre este arquivo...'
                  : 'Digite sua mensagem ou anexe um arquivo...'
              }
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || isSending}
              className="p-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 transition-colors shadow-sm cursor-pointer"
              title="Enviar via fetch POST"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
