# import libraries
from contextlib import asynccontextmanager
from typing import List
from pydantic import BaseModel

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from .database import create_db_and_tables, get_session, seed_db
from .models import Conversation, Message
from llm import generate_llm_response, llm_title

# runs startup code when FastAPI server starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()      # creates SQLite tables if don't already exist
    seed_db()       # populates test data (2 sample conversations)
    yield       # pauses here while server runs, resumes on shutdown


# creates FastAPI application and uses lifespan function for startup / shutdown events
app = FastAPI(lifespan=lifespan)

# enables Cross-Origin Resource Sharing (CORS), allows frontend to make requests to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # {"*"} means allow from anywhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# creates new conversation   FastAPI converts response to JSON
@app.post("/conversations/", response_model=Conversation)   # responds to HTTP POST requests
def create_conversation(
    # conversation: Conversation expects conversation object in request body (parsed from JSON)
    # session: Session = Depends(get_session) gets a database session for every request
    conversation: Conversation, session: Session = Depends(get_session)
):
    session.add(conversation)       # adds conversation to session
    session.commit()        # saves conversation to database
    session.refresh(conversation)       # reloads to get id and created_at
    return conversation 

# fetches all conversations
@app.get("/conversations/", response_model=List[Conversation])      # responds to HTTP GET requests
def read_conversations(
    offset: int = 0, limit: int = 100, session: Session = Depends(get_session)
):
    conversations = session.exec(
        select(Conversation).offset(offset).limit(limit)
    ).all()
    return conversations

# fetches single conversation by ID
@app.get("/conversations/{conversation_id}", response_model=Conversation)    # {conversation_id} sets the id to the end of the path
def read_conversation(
    conversation_id: int, session: Session = Depends(get_session)
):
    conversation = session.get(Conversation, conversation_id)       # look sup by primary key
    if not conversation:        # ir not found, retur 404 error
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@app.delete("/conversations/{conversation_id}")     # deletes conversations
def delete_conversation(
    conversation_id: int, session: Session = Depends(get_session)
):
    conversation = session.get(Conversation, conversation_id)      # gets the conversation
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    session.delete(conversation)        # deletes conversation
    session.commit()        # saves deletion to database
    return {"ok": True}     # returns to JSON to confirm success

@app.get("/conversations/{conversation_id}/messages", response_model=List[Message])
def get_messages(
    conversation_id: int, session: Session = Depends(get_session)
):
    conversation = session.get(Conversation, conversation_id)      # gets the conversation
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    query = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    messages = session.exec(query).all()
    return messages

@app.post("/conversations/{conversation_id}/messages", response_model=Message)
def create_message(
    conversation_id: int, 
    message: Message, 
    session: Session = Depends(get_session)
):
    conversation = session.get(Conversation, conversation_id)      # gets the conversation
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    message.conversation_id = conversation_id
    session.add(message)       # adds conversation to session
    session.commit()        # saves conversation to database
    session.refresh(message)       # reloads to get id and created_at

    query = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    get_llm = session.exec(query).all()
    get_llm_dict = [{'role': messages.role, 'content': messages.content} for messages in get_llm]
    llm_content = generate_llm_response(get_llm_dict)
    assistant_message = Message(
        role = 'assistant',
        content = llm_content,
        conversation_id=conversation_id
    )
    session.add(assistant_message)
    session.commit()
    session.refresh(assistant_message)  
    return assistant_message 


class Title(BaseModel):
    content: str

@app.post("/generate-title")
def generate_title(request: Title):
    result = llm_title(request.content)
    return {"title": result}