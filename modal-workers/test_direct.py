"""Direct test of Modal parsing function to see errors."""
import modal

# Import the app
from app import app, parse_soc2_document

@app.local_entrypoint()
def test():
    """Test the parsing function directly."""
    print("Testing direct function call...")

    # Test with a real document
    result = parse_soc2_document.remote(
        document_id="cc83c5d9-0ebc-4d8e-b850-9b50bfadbf5b",
        job_id="test-direct-call",
        organization_id="0e0c1ac3-8b7c-4a8e-bd76-586a3adaacca",
    )

    print(f"Result: {result}")
