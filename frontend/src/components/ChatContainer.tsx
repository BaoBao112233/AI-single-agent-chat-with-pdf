import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Download, Settings } from 'lucide-react';
import { Message, ChatSession } from '../types';
import { chatAPI } from '../services/api';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import FileUpload from './FileUpload';
import toast from 'react-hot-toast';

interface ChatContainerProps {
  sessionId: number;
  userId: number;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ sessionId, userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing session data
  useEffect(() => {
    const loadSession = () => {
      const savedSession = localStorage.getItem(`chat_session_${userId}_${sessionId}`);
      if (savedSession) {
        try {
          const session: ChatSession = JSON.parse(savedSession);
          setMessages(session.messages);
          setPdfUploaded(session.pdfUploaded || false);
          setPdfFileName(session.pdfFileName || '');
        } catch (error) {
          console.error('Error loading session:', error);
        }
      }
    };

    loadSession();
  }, [sessionId, userId]);

  // Save session data
  const saveSession = (updatedMessages: Message[]) => {
    const session: ChatSession = {
      id: `${userId}_${sessionId}`,
      sessionId,
      userId,
      messages: updatedMessages,
      lastActivity: new Date(),
      pdfUploaded,
      pdfFileName,
    };
    localStorage.setItem(`chat_session_${userId}_${sessionId}`, JSON.stringify(session));
  };

  const handleSendMessage = async (content: string) => {
    if (!pdfUploaded) {
      toast.error('Please upload a PDF file first');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };

    const newMessages = [...messages, userMessage, loadingMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        session_id: sessionId,
        user_id: userId,
        message: content,
      });

      if (response.error_status === 'success') {
        const assistantMessage: Message = {
          id: loadingMessage.id,
          content: response.response,
          sender: 'assistant',
          timestamp: new Date(),
          isLoading: false,
        };

        const finalMessages = [...messages, userMessage, assistantMessage];
        setMessages(finalMessages);
        saveSession(finalMessages);
      } else {
        // Remove loading message and show error
        setMessages([...messages, userMessage]);
        toast.error(response.error_status || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages([...messages, userMessage]);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (fileName: string) => {
    setPdfUploaded(true);
    setPdfFileName(fileName);
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `Great! I've successfully processed your PDF "${fileName}". You can now ask me questions about the document content. What would you like to know?`,
      sender: 'assistant',
      timestamp: new Date(),
    };
    
    const updatedMessages = [welcomeMessage];
    setMessages(updatedMessages);
    saveSession(updatedMessages);
    
    toast.success('PDF uploaded and processed successfully!');
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      setMessages([]);
      localStorage.removeItem(`chat_session_${userId}_${sessionId}`);
      toast.success('Conversation cleared');
    }
  };

  const exportChat = () => {
    const chatData = {
      sessionId,
      userId,
      pdfFileName,
      messages: messages.map(msg => ({
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      exportDate: new Date(),
    };

    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_export_${sessionId}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Chat exported successfully');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            AI Chat with PDF
          </h1>
          {pdfUploaded && pdfFileName && (
            <p className="text-sm text-gray-600 mt-1">
              Chatting about: <span className="font-medium">{pdfFileName}</span>
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={exportChat}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export chat"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={clearChat}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!pdfUploaded ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <FileUpload
                sessionId={sessionId}
                userId={userId}
                onUploadSuccess={handleUploadSuccess}
                isUploaded={pdfUploaded}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to chat!
                    </h3>
                    <p className="text-gray-600 max-w-sm">
                      Your PDF has been processed. Ask me anything about the document content.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={!pdfUploaded}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
