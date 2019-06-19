FROM node:10.16.0-stretch

LABEL Maintainer="yongs2@hotmail.com"

USER root
ARG APP_DIR=/app

# WORKDIR 로 설정
WORKDIR ${APP_DIR}

# openjdk-8 설치
ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64
RUN apt-get update \
    && apt-get -y install openjdk-8-jdk \
    && echo "JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64" > /etc/environment \
    && npm install node-gyp -g

# 디렉토리 생성 및 소스 복사
ADD ./ ${APP_DIR}
RUN npm install

#가상 머신에 오픈할 포트
EXPOSE 3000

#컨테이너에서 실행될 명령을 지정
CMD ["npm", "start"]

