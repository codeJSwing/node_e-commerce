# 더 빈번하게 사용할 수록 나중에 작성하는 것이 좋다.(layer)

# BASE 이미지 명시 - node 16버전
FROM node:16-alpine

RUN mkdir -p /usr/src/app
# 어플리케이션을 복사할 디렉토리 설정
WORKDIR /usr/src/app

COPY package.json .

# package.json 에 있는 모든 dependencies가 설치됨
# npm install은 설치할 당시 가장 최신 버전을 설치
# RUN npm ci 를 사용할 경우, package-lock.json 에 명시된 버전을 설치
RUN npm install

COPY index.js ./

EXPOSE 4444
CMD ["npm", "run", "dev"]