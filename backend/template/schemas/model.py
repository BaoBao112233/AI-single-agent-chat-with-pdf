from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    session_id: int
    user_id: int
    message: str

class ChatResponse(BaseModel):
    session_id: int
    user_id: int
    response: str
    error_status: str = "success"


# Request models
class ChatRequestAPI(BaseModel):
    session_id: int = Field(..., description="Unique identifier for the user session")
    user_id: int = Field(..., description="Unique identifier for the user")
    message: str = Field(..., description="User message to process")

# Response models
class APIResponse(BaseModel):
    session_id: Optional[int] = Field(None, description="Unique identifier for the user session")
    user_id: Optional[int] = Field(None, description="Unique identifier for the user")
    response: str = Field(..., description="Response message")
    error_status: str = Field(..., description="Error status message")