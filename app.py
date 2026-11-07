from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Allow your Edraw frontend origin to talk to the trainer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your Edraw app domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/parse-projection")
async def parse_projection(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    # TODO: Pass image_bytes to your fine-tuned model or Gemini AI Studio API
    # with your engineering system instructions & projection schema.
    
    # Mock structured response for projection of solids/planes
    extracted_data = {
        "status": "success",
        "reference_line": "XY",
        "views": {
            "top_view": {"labels": ["a", "b", "c"], "shape": "triangle"},
            "front_view": {"labels": ["a'", "b'", "c'"], "inclination": "30 degrees"}
        },
        "raw_text_lines": ["a'", "b'", "c'", "30°", "HP", "VP"]
    }
    
    return extracted_data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
