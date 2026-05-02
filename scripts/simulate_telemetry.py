import asyncio
import time
from app.services.kafka.producers import publish_student_activity

async def simulate_bulk_applications(student_id: int, count: int = 50):
    print(f"Starting telemetry simulation for Student {student_id}...")
    
    for i in range(1, count + 1):
        await publish_student_activity(
            student_id=student_id,
            activity_type="job_application",
            details={
                "source": "linkedin",
                "job_id": f"LNKD-{int(time.time())}-{i}",
                "company": "TechCorp",
                "iteration": i
            }
        )
        if i % 10 == 0:
            print(f"Sent {i}/{count} application events...")
        # Small sleep to simulate real-time stream
        await asyncio.sleep(0.05)
        
    print(f"Simulation complete. {count} events pushed to 'student.activity'.")
    print("Check milestone_consumer logs for IRR 25bps reduction trigger.")

if __name__ == "__main__":
    # Defaulting to student_id 1 (Active Alex)
    import sys
    sid = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    asyncio.run(simulate_bulk_applications(sid))
