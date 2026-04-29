from gtts import gTTS
from pydub import AudioSegment
import tempfile
import os

try:
    import simpleaudio
    HAS_SIMPLEAUDIO = True
except ImportError:
    HAS_SIMPLEAUDIO = False
    import subprocess
    import platform

def speak(text, lang='en'):
    """Convert text to speech and play it."""
    tts = gTTS(text=text, lang=lang)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
        tts.save(fp.name)
        temp_path = fp.name

    try:
        audio = AudioSegment.from_mp3(temp_path)
        
        if HAS_SIMPLEAUDIO:
            play_obj = simpleaudio.play_buffer(
                audio.raw_data,
                num_channels=audio.channels,
                bytes_per_sample=audio.sample_width,
                sample_rate=audio.frame_rate
            )
            play_obj.wait_done()
        else:
            # Fallback: use system media player
            if platform.system() == "Windows":
                os.startfile(temp_path)
                import time
                time.sleep(len(text) * 0.05 + 0.5)  # Approximate wait
            else:
                subprocess.call(['open' if platform.system() == 'Darwin' else 'xdg-open', temp_path])
                import time
                time.sleep(len(text) * 0.05 + 0.5)
    finally:
        try:
            os.remove(temp_path)
        except:
            pass
