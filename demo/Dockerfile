# === 階段一：使用 Maven 建置 .jar 檔 ===
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# 複製專案原始碼進來
COPY . .

# 執行打包
RUN mvn clean package -DskipTests

# === 階段二：使用精簡版 JDK 運行 ===
FROM eclipse-temurin:21-jdk-jammy

# 安裝工具包
RUN apt-get update && apt-get install -y iputils-ping default-mysql-client

# 確保mysql比springboot早執行完
#CMD sleep 10 && java -jar /app/app.jar

# 2. 設定工作目錄
WORKDIR /app

# 3. 將本地 target 資料夾中的 jar 文件複製到容器中
# COPY target/demo-0.0.1-SNAPSHOT.jar /app/app.jar
COPY --from=builder /app/target/demo-0.0.1-SNAPSHOT.jar /app/app.jar

# 4. 暴露應用所使用的端口（通常是 8080）
EXPOSE 8080

# 5. 啟動應用的命令
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
