.PHONY: build
build:
	docker build -t restapi -f Dockerfile .

.PHONY: run
run:
	docker run \
		-e "NODE_ENV=production" \
		-m "300M" --memory-swap "1G" \
		-e "DB_URL=jdbc:tibero:thin:@${SVC_HOST}:8629:DEV_DB" \
		-e "DB_USER=${DB_USER}" \
		-e "DB_PASS=${DB_PASS}" \
		-e "DB_MINPOOL=1" \
		-e "DB_MAXPOOL=10" \
		-d -p 3000:3000 --rm --name restapi restapi || :

.PHONY: exec
exec:
	docker exec -it restapi /bin/bash

.PHONY: stop
stop:
	docker stop restapi || :

.PHONY: logs
logs:
	docker logs -f restapi || :
