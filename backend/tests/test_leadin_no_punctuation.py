import pytest
from app.services.output_guard import is_emergency

@pytest.mark.parametrize("text", [
    "Not sure what's going on I want to hurt myself tonight",
    "Nothing helps I blacked out in the shower",
    "I don't know what to do I'm bleeding through my trousers and dizzy",
    "Without my partner here sudden numbness down my left side and I can't see out of one eye",
])
def test_neutral_opener_without_punctuation_still_fires(text):
    assert is_emergency(text)
