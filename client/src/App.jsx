import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Trash2,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import "./App.css";

const PROVIDER_MAP = [
  {
    name: "OpenAI",
    match: (key) => key.startsWith("sk-"),
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-3.5-turbo",
    headers: {},
  },
  {
    name: "Groq",
    match: (key) => key.startsWith("gsk_"),
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama3-8b-8192",
    headers: {},
  },
  {
    name: "Anthropic",
    match: (key) => key.startsWith("sk-ant-"),
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-opus-20240229",
    headers: {
      "anthropic-version": "2023-06-01",
    },
  },
  {
    name: "Mistral",
    match: (key) => key.includes("mistral"),
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-small",
    headers: {},
  },
  {
    name: "TogetherAI",
    match: (key) => key.startsWith("together-"),
    baseUrl: "https://api.together.xyz/v1",
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    headers: {},
  },
  {
    name: "Fireworks",
    match: (key) => key.startsWith("fk-"),
    baseUrl: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v2-7b-chat",
    headers: {},
  },
];

const App = () => {
  const [messages, setMessages] = useState([]); // Lista de mensajes del chat (usesuario y asistente)
  const [input, setInput] = useState(""); // Lo que el usuario escribe
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(""); // La key que escribe la persona
  const [baseUrl, setBaseUrl] = useState(""); //Dato del proveedor
  const [model, setModel] = useState(""); // Dato del proveedor
  const [extraHeaders, setExtraHeaders] = useState({}); // Dato del proveedor
  const [providerName, setProviderName] = useState(""); // Dato del proveedor
  const [manualMode, setManualMode] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true); // Si es true se muestra el input para poner la API key
  const messagesEndRef = useRef(null);

  // Cada vez que se escribe un mensaje se baja automaticamente
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detecta el proveedor de la API Key
  const detectProvider = (key) => {
    for (const provider of PROVIDER_MAP) {
      if (provider.match(key)) {
        setBaseUrl(provider.baseUrl);
        setModel(provider.model);
        setExtraHeaders(provider.headers);
        setProviderName(provider.name);
        setManualMode(false);
        return; // Salimos del if
      }
    }
    setManualMode(true); // Activamos el manualMode, si no coincide ninguno
    setProviderName("Unknown");
  };

  const sendMessage = async () => {
    // Funcion asincrona para enviar un mensaje
    if (!input.trim() || isLoading) return; // Si el input esta vacio o tiene espacios, no hace nada
    if (!apiKey || !baseUrl || !model) {
      // Si faltan o fallan la api, url o el modelo saldrá la siguiente alerta
      alert("Faltan datos necesarios: API Key, modelo o URL");
      return;
    }

    const userMessage = { role: "user", content: input }; // Crea un objeto del usuario para el historial
    const newMessages = [...messages, userMessage]; // Crea una nueva lista de mensajes añadiendo al usuario
    setMessages(newMessages); // Analiza el estado del mensaje
    setInput(""); // Limpiar el textarea
    setIsLoading(true); // Activa el está escribiendo

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        // Hacer POST al endpoint del proveedor detectado
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model: model, // Modelo
          messages: newMessages, // Se envia todos los mensajes
          max_tokens: 1000, // Limite de tockens
          temperature: 0.7, // Aletoriedad y creatividad
        }),
      });

      const data = await response.json(); // Parsea la respuesta json del servidor

      if (!response.ok) {
        // Si el estatus no es el esperado, saca el mensaje de error y el asistenete lo muestre
        const msg = data?.error?.message || "Error desconocido";
        setMessages([
          ...newMessages,
          { role: "assistant", content: `❌ Error: ${msg}` },
        ]);
        return;
      }

      const reply = data.choices?.[0]?.message?.content || "❌ Respuesta vacía"; // Toma el texto devuelto por el modelo, si no hay pone un aviso
      setMessages([...newMessages, { role: "assistant", content: reply }]); // Añade la respuesta al asistente del chat
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: `❌ Error de red: ${err.message}` },
      ]); // Si huvo un error el asistente lo muestra
    }

    setIsLoading(false); // Quita el mensage de que esta escribiendo
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md space-y-4">
          <div className="text-center space-y-2">
            <Bot className="mx-auto text-green-400" size={48} />
            <h1 className="text-2xl font-bold text-white">AI Key test</h1>
            <p className="text-gray-400 text-sm">Enter your API Key</p>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API Key"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
          />

          <button
            onClick={() => {
              detectProvider(apiKey);
              setShowApiKeyInput(false);
            }}
            disabled={!apiKey.trim()}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
          >
            Start chat
          </button>

          {manualMode && (
            <div className="space-y-2 pt-4 border-t border-gray-700">
              <div className="text-yellow-400 text-sm flex items-center gap-2">
                <ShieldAlert size={16} /> Manual mode activated
              </div>

              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Modelo (ej: gpt-3.5-turbo)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />

              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="URL base (ej: https://api.custom.com/v1)"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg"
              />
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-2 mx-2">
            Your key is used locally only. Support for OpenAI, Groq, Claude, and
            more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bot className="text-green-400" />
          <h1 className="text-lg font-semibold">
            AI ({providerName})
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMessages([])}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            title="Limpiar chat"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
          >
            Change API Key
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-xl mb-2">¡Start your conversation!</h2>
            <p>Write your message below to start chatting</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex space-x-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-700 p-4">
        <div className="flex w-250 mx-auto space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your message here..."
            className="flex-1 p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none resize-none"
            rows="1"
            style={{ minHeight: "48px", maxHeight: "120px" }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line{" "}
        </p>
      </div>
    </div>
  );
};

export default App;
