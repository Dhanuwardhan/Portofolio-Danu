"use client";

import React, {
  useState,
  useEffect,
  useRef,
  FormEvent,
  KeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import Linkify from "react-linkify"; // For detecting and making links clickable
import {
  handleCommand,
  banner,
  initialMessage,
  help,
} from "../../data/commands"; // Import help for autocomplete
import styles from "@/app/components/Terminal/Terminal.module.css";

interface HistoryItem {
  type: "prompt" | "output";
  content: string;
}

interface TerminalProps {
  onBannerComplete?: () => void;
}

export default function Terminal({ onBannerComplete }: TerminalProps) {
  const [terminalInput, setTerminalInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFullTerminal, setShowFullTerminal] = useState(false);
  const [initialMessageComplete, setInitialMessageComplete] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]); // Store command history
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Track current position in history
  const inputRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null); // Change to HTMLDivElement

  const handleInput = (e: FormEvent<HTMLDivElement>) => {
    setTerminalInput(e.currentTarget.textContent || "");
  };

  const handleEnter = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await executeCommand(terminalInput);
      setTerminalInput("");
      if (inputRef.current) {
        inputRef.current.textContent = "";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Command history navigation
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      let newIndex = historyIndex;

      if (e.key === "ArrowUp" && newIndex < commandHistory.length - 1) {
        newIndex += 1;
      } else if (e.key === "ArrowDown" && newIndex > 0) {
        newIndex -= 1;
      }

      if (newIndex !== historyIndex) {
        setHistoryIndex(newIndex);
        const command =
          commandHistory[commandHistory.length - 1 - newIndex] || "";
        setTerminalInput(command);
        if (inputRef.current) {
          inputRef.current.textContent = command;
          moveCaretToEnd(inputRef.current); // Move caret to the end
        }
      }
    }

    // Autocomplete on Tab
    if (e.key === "Tab") {
      e.preventDefault();
      const input = terminalInput.trim();
      if (input) {
        const matchedCommand = help.find((cmd) => cmd.startsWith(input));
        if (matchedCommand) {
          setTerminalInput(matchedCommand);
          if (inputRef.current) {
            inputRef.current.textContent = matchedCommand;
            moveCaretToEnd(inputRef.current); // Move caret to the end
          }
        }
      }
    }
  };

  // Helper function to move the caret to the end of the content
  const moveCaretToEnd = (element: HTMLElement) => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false); // Move caret to the end
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const executeCommand = async (command: string) => {
    if (isTyping) return; // Prevent multiple commands at once

    if (command.trim() === "clear") {
      setHistory([]);
      return;
    }

    // Add command to history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1); // Reset history index after executing a new command

    const output = await handleCommand(command); // Await the handleCommand function

    // Simulate typing animation
    setIsTyping(true);
    setHistory((prev) => [
      ...prev,
      { type: "prompt", content: `visitor@naufal.me:~$ ${command}` }, // Add the command to history as prompt
      { type: "output", content: "" }, // Start with empty output
    ]);

    simulateTyping(output, 10, () => {
      setIsTyping(false); // End typing state
    });
  };

  const simulateTyping = (
    text: string,
    speed: number,
    callback: () => void
  ) => {
    let index = 0;
    let currentLine = "";

    const interval = setInterval(() => {
      if (index < text.length) {
        currentLine += text[index];
        setHistory((prev) => [
          ...prev.slice(0, -1),
          { type: "output", content: currentLine },
        ]);
        index++;

        // Move caret to the end of the output
        if (outputRef.current) {
          outputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
          moveCaretToEnd(outputRef.current);
        }
      } else {
        clearInterval(interval);
        callback();
      }
    }, speed);
  };

  useEffect(() => {
    setIsTyping(true);
    simulateTyping(initialMessage, 10, () => {
      setIsTyping(false);
      setInitialMessageComplete(true);
      setTimeout(() => {
        setShowFullTerminal(true);
        clearHistoryAndShowBanner();
      }, 1000);
    });
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (!isTyping && showFullTerminal) {
      focusInput();
    }
  }, [isTyping, showFullTerminal]);

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearHistoryAndShowBanner = () => {
    setHistory([]);
    setIsTyping(true);
    simulateTyping(banner, 5, () => {
      setIsTyping(false);
      focusInput();
      if (onBannerComplete) {
        onBannerComplete(); // Notify when banner typing is complete
      }
    });
  };

  if (!initialMessageComplete) {
    return (
      <div className="text-white">
        <pre className="whitespace-pre-wrap">{history[0]?.content || ""}</pre>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: showFullTerminal ? 1 : 0,
        scale: showFullTerminal ? 1 : 0.95,
      }}
      transition={{ duration: 1, ease: "easeInOut" }}
      className="w-full max-w-full p-4 bg-[#131821] border-[2px] border-[#273344] text-slate-200 rounded-xl font-mono text-md"
      onClick={focusInput}
    >
      <div className="bg-[#131821] text-slate-200 font-mono text-md p-4">
        <div className="flex items-center mb-3 space-x-2">
          <div className="w-3 h-3 bg-[#FF6059] rounded-full"></div>
          <div className="w-3 h-3 bg-[#FFBE2F] rounded-full"></div>
          <div className="w-3 h-3 bg-[#29CE42] rounded-full"></div>
        </div>
        <div className="w-full flex items-center justify-center mb-4">
          visitor@naufal.me:~$
        </div>
        <div
          className="terminal overflow-x-auto"
          ref={terminalRef}
          style={{ maxWidth: "100%" }}
        >
          <div className={`${styles.terminalOutput} ${styles.scrollbar}`}>
            {history.map((item, index) => (
              <div
                key={index}
                className={`pb-2 ${
                  item.type === "output" ? "pl-4" : "text-[#FFA23E]"
                }`}
              >
                {item.type === "output" ? (
                  <Linkify
                    componentDecorator={(decoratedHref, decoratedText, key) => (
                      <a
                        href={decoratedHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#FFA23E",
                          textDecoration: "underline",
                        }}
                      >
                        {decoratedText}
                      </a>
                    )}
                  >
                    <pre
                      ref={index === history.length - 1 ? outputRef : null} // Attach ref to the last output
                      className="whitespace-pre"
                    >
                      {item.content}
                    </pre>
                  </Linkify>
                ) : (
                  item.content
                    .split("\n")
                    .map((line, i) => <div key={i}>{line}</div>)
                )}
              </div>
            ))}
            {!isTyping && (
              <div className="flex items-center">
                <span className="mr-1 text-[#FFA23E]">
                  visitor@naufal.me:~$
                </span>
                <div
                  ref={inputRef}
                  contentEditable={!isTyping}
                  className={`terminal-input bg-transparent text-slate-200 border-none outline-none resize-none font-mono h-6 caret-transparent focus:ring-0 focus:outline-none w-auto min-w-[10px] whitespace-pre-wrap ${
                    isTyping ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onInput={handleInput}
                  onKeyDown={(e) => {
                    handleEnter(e);
                    handleKeyDown(e);
                  }}
                  style={{ display: "inline-block" }}
                  spellCheck={false}
                />
                <div className="w-2 h-4 bg-[#C5C5C5] inline-block ml-1 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
