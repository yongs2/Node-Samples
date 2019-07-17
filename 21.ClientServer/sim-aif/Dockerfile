FROM python:3

LABEL Maintainer="yongs2@j-din.com"

USER root
ARG APP_DIR=/app

# WORKDIR 로 설정
WORKDIR ${APP_DIR}

# 디렉토리 생성 및 소스 복사
ADD ./ ${APP_DIR}

RUN	apt-get update \
	&& pip install -r requirements.txt

#가상 머신에 오픈할 포트
EXPOSE 4000 4443

#컨테이너에서 실행될 명령을 지정
CMD ["python", "simm_AIF_SVR.py"]
