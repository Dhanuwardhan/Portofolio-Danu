"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { predefinedQuestions } from "@/app/data/chatbots";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", isUser: false },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const questionContainerRef = useRef<HTMLDivElement>(null);

  const handleQuestionClick = async (question: string) => {
    setMessages((prev) => [...prev, { text: question, isUser: true }]);
    const botResponse = await simulateBotResponse(question);
    setMessages((prev) => [...prev, { text: botResponse, isUser: false }]);
  };

  const simulateBotResponse = async (question: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const matchedQuestion = predefinedQuestions.find(
      (item) => item.question === question
    );
    return matchedQuestion
      ? matchedQuestion.answer
      : "I'm sorry, I don't have information about that specific question. Is there anything else I can help you with?";
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (questionContainerRef.current?.offsetLeft || 0));
    setScrollLeft(questionContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (questionContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1;
    if (questionContainerRef.current) {
      questionContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full p-2 bg-[#131821]/50 backdrop-blur-lg border-[2px] border-[#273344]/50 text-slate-200 transition-all duration-300 hover:border-[#273344] ${
          isOpen ? "bg-[#1c2736]" : ""
        }`}
        variant={isOpen ? "default" : "outline"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        <span className="sr-only">Chat Bot</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 w-[90vw] max-w-[400px] h-[500px] bg-[#131821]/50 backdrop-blur-lg border-[2px] border-[#273344] rounded-xl overflow-hidden shadow-xl flex flex-col"
          >
            {/* Title Bar */}
            <div className="p-4 bg-[#131821]/80 border-b border-[#273344] backdrop-blur-md">
              <h3 className="text-white font-medium text-center">🤖 PALLY</h3>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-grow p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    message.isUser ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block p-2 rounded-lg ${
                      message.isUser
                        ? "bg-[#1c2736] text-slate-200"
                        : "bg-[#273344] text-slate-200"
                    }`}
                  >
                    {message.text}
                  </span>
                </div>
              ))}
            </ScrollArea>

            {/* Questions Carousel */}
            <div
              ref={questionContainerRef}
              className="p-4 border-t border-[#273344] bg-[#131821]/50"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="flex space-x-2 overflow-x-auto"
                style={{ width: "max-content" }}
              >
                {predefinedQuestions.map((item, index) => (
                  <Button
                    key={index}
                    onClick={() => handleQuestionClick(item.question)}
                    variant="outline"
                    className="whitespace-nowrap bg-[#131821]/50 backdrop-blur-lg border-[1px] border-[#273344]/50 text-slate-200"
                  >
                    {item.question}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
