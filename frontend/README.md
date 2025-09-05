# Frontend for AI Chat with PDF

A modern React frontend for the AI-powered PDF chat application.

## Features

- **Modern UI**: Clean, responsive design with Tailwind CSS
- **File Upload**: Drag & drop PDF upload with progress indicators
- **Real-time Chat**: Interactive chat interface with typing indicators
- **Message History**: Persistent chat sessions with local storage
- **Markdown Support**: Rich text rendering for AI responses
- **Code Highlighting**: Syntax highlighting for code blocks
- **Export/Import**: Export chat conversations as JSON
- **Mobile Responsive**: Works seamlessly on desktop and mobile

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Markdown** for message rendering
- **React Hot Toast** for notifications
- **Axios** for API communication

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend server running on port 5555

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file (optional):
```bash
# .env.local
VITE_API_URL=http://localhost:5555
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

Built files will be in the `dist` directory.

## Usage

1. **Upload PDF**: Drag and drop or click to upload a PDF file
2. **Wait for Processing**: The AI will process your document
3. **Start Chatting**: Ask questions about your PDF content
4. **Export/Clear**: Use the header buttons to manage your conversation

## API Integration

The frontend integrates with the FastAPI backend using these endpoints:

- `POST /upload/pdf` - Upload PDF files
- `POST /ai/chat` - Send chat messages
- `GET /health` - Health check

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatContainer.tsx    # Main chat interface
│   ├── ChatInput.tsx        # Message input component
│   ├── FileUpload.tsx       # PDF upload component
│   └── MessageBubble.tsx    # Individual message display
├── services/           # API services
│   └── api.ts             # Axios API client
├── types/              # TypeScript type definitions
│   └── index.ts           # Shared interfaces
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Configuration

### Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:5555)

### Customization

- **Colors**: Modify the Tailwind color palette in `tailwind.config.js`
- **API**: Update endpoints in `src/services/api.ts`
- **Styling**: Customize component styles using Tailwind classes

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- ESLint for code quality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
