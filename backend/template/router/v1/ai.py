import os
from fastapi import APIRouter, UploadFile, File
from cachetools import TTLCache
from template.agent.agent import Agent
from template.configs.environments import env
from template.agent.tools.read_pdf import (
    ingest_pdf_to_db,
    setup_env,
    get_db_path,
    get_openai_client
)
from template.schemas.model import (
    ChatRequest, 
    ChatResponse,
    ChatRequestAPI,
    APIResponse
)

Router_chat = APIRouter(
    prefix="/ai", tags=["Chat with PDF"]
)

Router_upload_file = APIRouter(
    prefix="/upload", tags=["Upload file"]
)

cache = TTLCache(maxsize=500, ttl=300)
# @Router.post("/chat", response_model=ChatResponse)
# def chat(request: ChatRequest, agent: Agent = Depends()) -> ChatResponse:
#     response = agent.chat(request)
#     return response


# Routes
@Router_chat.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequestAPI):
    """Process a chat message and return a response"""
    try:
        agent = Agent(api_key=env.OPENAI_API_KEY)
        # Convert to internal ChatRequest
        chat_request = ChatRequest(
            session_id=request.session_id,
            user_id=request.user_id,
            message=request.message
        )

        print(f'session_id: {request.session_id} | message: {request.message}')

        # Process the request
        response = agent.chat(chat_request)
        # Đảm bảo response là kiểu chuỗi
        response_text = response.response if hasattr(response, 'response') else str(response)
        return ChatResponse(
            session_id=request.session_id,
            user_id=request.user_id,
            response=response_text
        )
    except Exception as e:
        return ChatResponse(
            session_id=request.session_id,
            user_id=request.user_id,
            response="",
            error_status=f"Error processing request: {e}"
        )

@Router_upload_file.post("/pdf")    
async def upload_pdf(
    session_id: int,
    user_id: int,
    file: UploadFile = File(...)):
    """Upload a PDF file for processing"""
    try:
        if file.content_type != "application/pdf":
            return APIResponse(
                response="",
            error_status="Invalid file type. Please upload a PDF file."
        )

        if file.filename == "":
            return APIResponse(
                response="",
                error_status="No file uploaded. Please upload a PDF file."
            )
    

        folder_path = env.UPDATE_PATH + f"/{user_id}/{session_id}/pdf"
        
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
        
        file_path = f"{folder_path}/{file.filename}"

        with open(file_path, "wb") as f:
            f.write(await file.read())

        database_path = env.DATABASE_PATH + f"/{user_id}/{session_id}"

        if not os.path.exists(database_path):
            os.makedirs(database_path)

        setup_env()
        client = get_openai_client()
        db_path = get_db_path(database_path+"/rag_vector_db.json")

        doc_id = ingest_pdf_to_db(file_path, db_path, client)

        if not doc_id:
            print("[WARN] Ingestion did not complete successfully.")
        else:
            print(f"[INFO] Ingestion completed. document_id={doc_id}")

        return APIResponse(
            session_id=session_id,
            user_id=user_id,
            response="PDF file uploaded successfully.",
            error_status="success"
            )
    except Exception as e:
        return APIResponse(
            session_id=session_id,
            user_id=user_id,
            response="",
            error_status=f"Error processing file: {e}"
        )
