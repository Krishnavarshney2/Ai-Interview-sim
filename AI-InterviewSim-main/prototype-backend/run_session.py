from interview_session import InterviewSession
import os
import sys
import time
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'utils')))
from attention_tracker import ContinuousAttentionTracker
from speech_to_text import record_audio, transcribe


def track_attention(duration=5):
    """Track attention for a given duration and return the attention score."""
    time.sleep(duration)  # Let the background tracker run
    return tracker.get_attention_score()


def main():
    # Start attention tracking at the beginning
    tracker = ContinuousAttentionTracker()
    tracker.start()

    session = InterviewSession(
        resume_path='test-files/Rahul_Resume_provisional__parsed.json',
        role='Software Development Engineer',
        rounds=3
    )

    print("Starting Interview...\n")

    while not session.is_complete():
        q = session.ask_question()
        if q is None:
            break
        print(f'\n🤖 Question: {q}')
        
        # Record and transcribe answer
        audio_path = record_audio()
        answer = transcribe(audio_path)
        print(f"🧑 You said: {answer}")

        # Track attention during answer
        attention = track_attention(duration=6)
        print(f"🧠 Attention Score: {attention}%")
        
        # Store attention in history
        if session.history:
            session.history[-1]["attention"] = attention
            
        followup = session.get_followup(answer)
        if followup:
            print(f"\n🤖 Follow-up: {followup}")
            audio_path = record_audio()
            followup_answer = transcribe(audio_path)
            print(f"🧑 You said: {followup_answer}")

            followup_attention = track_attention(duration=6)
            print(f"🧠 Attention Score: {followup_attention}%")
            # Store follow-up with same parent question's history
            session.history[-1]["followup_answer"] = followup_answer
            session.history[-1]["followup_attention"] = followup_attention
        
        # Record answer in session
        session.provide_answer(answer)

    # Stop attention tracking and get final score
    tracker.stop()
    final_score = tracker.get_attention_score()
    print(f"\n🧠 Final Attention Score: {final_score}%")

    # Store in session for feedback generation
    session.final_attention = final_score

    print('\n✅ Interview Completed')
    print('\n📋 Interview Summary')
    for i, step in enumerate(session.summary(), 1):
        print(f"\n🔹 Q{i}: {step['question']}")
        print(f"   🧑 Answer: {step['answer']}")
        if step.get('followup'):
            print(f"   🤖 Follow-Up: {step['followup']}")
            if step.get('followup_answer'):
                print(f"   🧑 Follow-Up Answer: {step['followup_answer']}")
        else:
            print("   ✅ No follow-up.")


if __name__ == '__main__':
    main()