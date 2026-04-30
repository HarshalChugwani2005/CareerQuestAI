# Kafka Event Streaming Pipeline
## Status: Planning [Phase 1/8]

### Topics
```
student.activity
student.milestones  
market.signals
ml.score.requests
ml.score.results
alerts.triggered
+ *.dlq (dead letter)
```

### Phase 1: Models `app/models/kafka_event.py`
```
KafkaEvent: id, topic, key, payload:JSONB, status, processed_at, error
```

### Phase 2: Base Classes `app/services/kafka/base.py`
```
KafkaProducer: async publish(topic, key, value, retries=3)
KafkaConsumer: async subscribe(topics), process(msg), DLQ on fail
```

### Phase 3: Producers
```
ingest.py, telemetry.py, market_fetcher.py: on_success → producer.send()
```

### Phase 4: Consumers (separate workers)
```
docker-compose consumers:
  - activity → TelemetrySession aggregate
  - milestone → IRR recalc /loans/{id}/apply-irr
  - market → MarketSignal upsert
  - score.request → ML /score → score.results
  - score.result → EmployabilityScore + EWS check
```

### Phase 5: Health `app/api/routes/kafka.py`
```
GET /kafka/health: consumer lag, topic list, DLQ counts
```

### Phase 6: docker-compose.yml
```
kafka + zookeeper + fastapi + 5 consumers + postgres/redis
```

### Phase 7: .env
```
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

### Phase 8: requirements.txt
```
confluent-kafka==2.5.0
```

**Next**: KafkaEvent model + migration?


