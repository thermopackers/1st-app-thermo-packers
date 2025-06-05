import { useState, useRef, useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import {
  Mic,
  MicOff,
  SendHorizonal,
  LoaderCircle,
  X,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import contactDetails from "../../../backend/data/contactDetails.js";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../axiosInstance";

const SmartBot = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const bottomRef = useRef(null);
  const botRef = useRef(null);
  const navigate = useNavigate();

  // const { speak, speaking, cancel } = useSpeechSynthesis();
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const greetings = [
    "hello",
    "hey",
    "hi",
    "how are you",
    "good morning",
    "good afternoon",
    "good evening",
  ];

  useEffect(() => {
    if (visible && messages.length === 0) {
      const welcome = "Hi there! 👋 I'm SmartBot. How can I assist you today?";
      const welcome2 = "Please type the name of product you want to enquire";
      addBotMessage(welcome);
      addBotMessage(welcome2);
    }
  }, [visible]);

  useEffect(() => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (visible && botRef.current && !botRef.current.contains(e.target))
        setVisible(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [visible]);

  const addBotMessage = (text, options = {}) => {
    const message = { role: "bot", text, ...options };
    setMessages((prev) => [...prev, message]);
    // if (options.silent !== true)
    //   speak({
    //     text: message.text,
    //     rate: 1.6, // 🚀 Faster speed (1.0 is normal, 1.5 is faster)
    //     pitch: 1.6, // Normal pitch
    //     volume: 1, // Full volume
    //     lang: "en-US",
    //   });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    const userLower = userMessage.toLowerCase();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      let reply = "";
      let redirect = null;

      if (greetings.some((g) => userLower.includes(g))) {
        reply = "Hello! 👋 How can I help you today?";
      } else if (
        userLower.includes("contact") ||
        userLower.includes("email") ||
        userLower.includes("phone") ||
        userLower.includes("company") ||
        userLower.includes("address")
      ) {
        reply = `📞 Phone: ${contactDetails.phone}\n📧 Email: ${contactDetails.email}\n🏢 Address: ${contactDetails.address}`;
      } else if (
        userLower.includes("product") ||
        userLower.includes("products") ||
        userLower.includes("category") ||
        userLower.includes("categories")
      ) {
        reply = "Sure! Taking you to our product catalog.";
        redirect = "/products";
      } else {
        const res = await axiosInstance.post("/chat", {
          message: userMessage,
          context,
        });
        reply = res.data.reply;
        redirect = res.data.redirect;
        if (res.data.context) setContext(res.data.context);
      }

      addBotMessage(reply, { product: redirect });

      if (redirect) {
        setTimeout(() => navigate(redirect), 3500);
      }
    } catch (err) {
      addBotMessage("Sorry, I encountered an error. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const useTranscript = () => {
    setInput(transcript);
    SpeechRecognition.stopListening();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const handleFeedback = (index, type) => {
    const newMessages = [...messages];
    newMessages[index].feedback = type;
    setMessages(newMessages);
  };

  return (
    <>
      {!visible && (
        <div className="fixed bottom-28 right-5 z-50 flex items-center">
          <motion.div
            animate={{ x: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="bg-white text-gray-800 px-4 py-2 text-sm rounded-lg shadow">
              Need help finding a product? Just ask!
            </div>
          </motion.div>
          <button
            onClick={() => setVisible(true)}
            className="cursor-pointer w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 text-white rounded-full shadow-xl hover:scale-110 transition"
          >
            <MessageCircle className="w-10 h-10 mx-auto" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {visible && (
          <motion.div
            ref={botRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-4 w-[90%] max-w-md bg-white rounded-3xl shadow-xl/30 p-4 z-50 border border-[#08080823]"
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-gradient bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                🤖 SmartBot
              </h2>
              <button
                onClick={() => setVisible(false)}
                className="text-red-500 cursor-pointer hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-64 overflow-y-auto space-y-2 px-1 custom-scrollbar">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-md transition-all duration-300
                    ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800 border"
                    }`}
                  >
                    <p>{msg.text}</p>
                   
                    {msg.role === "bot" && !msg.feedback && (
                      <div className="flex gap-2 items-center mt-1 text-gray-400">
                        <button
                          onClick={() => handleFeedback(i, "up")}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-4 h-4 hover:text-green-500" />
                        </button>
                        <button
                          onClick={() => handleFeedback(i, "down")}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-4 h-4 hover:text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start items-center gap-2 text-sm text-gray-500">
                  <LoaderCircle className="animate-spin w-4 h-4" /> SmartBot is
                  thinking...
                </div>
              )}
              <div ref={bottomRef}></div>
            </div>

            <div className="mt-4 flex gap-2 items-center">
              <input
                type="text"
                value={input}
                placeholder="Ask me anything..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSend}
                className="bg-blue-500 cursor-pointer hover:bg-blue-600 text-white p-2 rounded-xl shadow-lg"
              >
                <SendHorizonal className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
              <button
                onClick={() => {
                  resetTranscript();
                  SpeechRecognition.startListening({ continuous: false });
                }}
                className="flex items-center gap-1 text-green-600"
              >
                {listening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}{" "}
                Voice
              </button>
              <button onClick={useTranscript} className="text-blue-600">
                ↳ Use Transcript
              </button>
            </div>

            {!browserSupportsSpeechRecognition && (
              <p className="mt-2 text-red-500 text-xs text-center">
                ⚠️ Voice input not supported in this browser.
              </p>
            )}

            {/* {speaking && (
              <button
                onClick={cancel}
                className="mt-2 w-full text-sm text-white bg-red-500 hover:bg-red-600 py-1.5 rounded-xl"
              >
                🔇 Stop Speaking
              </button>
            )} */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartBot;
