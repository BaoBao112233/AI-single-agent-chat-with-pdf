import { useState } from 'react';
import ChatContainer from './components/ChatContainer';
import { User, MessageSquare, FileText } from 'lucide-react';

function App() {
  const [sessionId] = useState(0); // Static for demo, could be dynamic
  const [userId] = useState(0); // Static for demo, could be dynamic

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* App Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  AI Chat with PDF
                </h1>
                <p className="text-sm text-gray-600">
                  Upload and chat with your documents using AI
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>User ID: {userId}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Session: {sessionId}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className="h-full bg-white shadow-lg border border-gray-200 mx-4 my-4 rounded-lg overflow-hidden">
            <ChatContainer sessionId={sessionId} userId={userId} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <p className="text-sm text-gray-500">
              Powered by AI • Built with React & FastAPI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
