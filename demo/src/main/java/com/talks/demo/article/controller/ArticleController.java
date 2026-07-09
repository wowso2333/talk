package com.talks.demo.article.controller;

import com.talks.demo.articleDao.dao.UserMapper;
import com.talks.demo.articleDao.pojo.Article;
import com.talks.demo.articleDao.pojo.ArticleDTO;
import com.talks.demo.articleDao.pojo.Board;
import com.talks.demo.articleDao.pojo.User;
import org.jsoup.safety.Safelist;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

@RequestMapping("/article")
@RestController
public class ArticleController {

    // 初始化 Log記錄器
    private static final Logger logger = LoggerFactory.getLogger(ArticleController.class);

    @Autowired
    private UserMapper userMapper;

    // 修改常量名稱以更具描述性
    private static final String POPULAR_ARTICLES_KEY = "popular_articles";
    private static final String LATEST_ARTICLES_KEY = "latest_articles";
    private static final String SPECIFIC_ARTICLE_KEY = "specific_articles";
    private static final String ALL_BOARDS_KEY = "all_boards";
    private static final String NULL_ARTICLE_CACHE_VALUE = "__NULL_ARTICLE__";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;  // 注入 ObjectMapper

    @Value("${cache.ttl-jitter-percent:20}")
    private int cacheTtlJitterPercent;


    @GetMapping("/test")
    public String tryApi() {
        return "test??";
    }


    // 測試redis
    @GetMapping("/redis/get")
    public Object getRedisValue(@RequestParam String key) {
        Object value = getCache(key);
        if (value != null) {
            return "Key 的值為: " + value.toString();
        } else {
            return "Key 不存在";
        }
    }

    //取得頭像和userId
    @GetMapping("/getUerInformation")
    public ResponseEntity<?> getAvatar(@RequestParam String username) {

        try {
            User user =  userMapper.getUerInformation(username);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred while fetching avatar and id");
        }
    }

    // 取得keyWord
    @GetMapping("/keyWord")
    public List<Article> searchKeyWord(@RequestParam String keyWord) {

        try {
            List<Article> results= userMapper.searchKeyWord(keyWord);
            return results;
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("search keyWord fail");
            return Collections.emptyList();  // 返回空列表
        }
    }

    //新增文章
    @PostMapping("/add")
    public String addArticle(@RequestBody Article article){
        try {
            // 淨化文章內容，防止 XSS 攻擊
            String sanitizedContent = sanitizeHtml(article.getContent());
            article.setContent(sanitizedContent);

            userMapper.addArticle(article);
            invalidateArticleCaches(null);
            return "add article success";
        } catch (Exception e) {
            e.printStackTrace();
            return "add article fail" + e.getMessage();
        }
    }

    // HTML 淨化方法
    public String sanitizeHtml(String content) {
        Safelist safelist = new Safelist()
                .addTags("a", "b", "i", "strong", "em", "p", "ul", "li", "ol", "br", "h1", "h2", "img", "blockquote")
                .addAttributes("a", "href")
                .addAttributes("img", "src", "alt", "title")
                .addProtocols("a", "href", "http", "https")
                .addProtocols("img", "src", "http", "https");  // 限制 `<img>` 標籤的 src 協議為 http 和 https
        return Jsoup.clean(content, safelist);
    }

    //獲取熱門文
    @GetMapping("/popular")
    public List<ArticleDTO> getHotArticle(){
        try {
            // 先從 Redis 查詢熱門文章緩存
            List<ArticleDTO> hotArticle =  (List<ArticleDTO>) getCache(POPULAR_ARTICLES_KEY);

            if(hotArticle == null){
                hotArticle = refreshHotArticle();
            }
            return hotArticle;

        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();  // 返回空列表
        }
    }

    public List<ArticleDTO> refreshHotArticle(){
        List<ArticleDTO> articles = userMapper.getHotArticle();

        articles.forEach(article -> {
            // 對每一篇文章進行處理
            // 使用 Jsoup 解析文章內容的 HTML
            Document doc = Jsoup.parse(article.getContent());

            // 提取前20個字作為摘要
            String text = doc.body().text();
            String excerpt = text.length() > 45 ? text.substring(0, 45) : text; // 取得前20個字
            article.setContent(excerpt);

            // 提取第一張圖片的 URL
            Element img = doc.select("img").first(); // 選擇第一個 <img> 標籤
            String imageUrl = img != null ? img.attr("src") : "";
            article.setFirstImgUrl(imageUrl);
        });

        // 將結果存入 Redis 並設置過期時間
        setCache(POPULAR_ARTICLES_KEY, articles, 30, TimeUnit.MINUTES);

        return articles;
    }

    //獲取最新文
    @GetMapping("/latest")
    public  ResponseEntity<?> getNewArticle(){
        try {
            // 先從 Redis 查詢熱門文章緩存
            List<ArticleDTO> latestArticle =  (List<ArticleDTO>) getCache(LATEST_ARTICLES_KEY);

            if(latestArticle == null){
                latestArticle = refreshLatestArticle();
            }

            return ResponseEntity.ok(latestArticle);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred while get latestArticles");
        }
    }

    public List<ArticleDTO> refreshLatestArticle(){
        List<ArticleDTO> articles = userMapper.getNewArticle();

        articles.forEach(article -> {
            // 對每一篇文章進行處理
            // 使用 Jsoup 解析文章內容的 HTML
            Document doc = Jsoup.parse(article.getContent());

            // 提取前20個字作為摘要
            String text = doc.body().text();
            String excerpt = text.length() > 30 ? text.substring(0, 30) : text; // 取得前20個字
            article.setContent(excerpt);

            // 提取第一張圖片的 URL
            Element img = doc.select("img").first(); // 選擇第一個 <img> 標籤
            String imageUrl = img != null ? img.attr("src") : "";
            article.setFirstImgUrl(imageUrl);
        });

        //存入緩存
        setCache(LATEST_ARTICLES_KEY, articles, 5, TimeUnit.SECONDS);

        return articles;
    }

    //編輯文章
    @PostMapping("/edit")
    public String editArticle(@RequestBody Article article){
        try {
            // 淨化文章內容，防止 XSS 攻擊
            String sanitizedContent = sanitizeHtml(article.getContent());
            article.setContent(sanitizedContent);

            userMapper.updateArticle(article);
            invalidateArticleCaches(article.getArticleId());

            return "edit article success";
        } catch (Exception e) {
            e.printStackTrace();
            return "edit article fail";
        }
    }

    //刪除文章
    @DeleteMapping("/delete")
    public String deleteArticle(@RequestParam int articleId){
        try {
            userMapper.deleteArticle(articleId);
            invalidateArticleCaches(articleId);
            return "delete article success";
        } catch (Exception e) {
            e.printStackTrace();
            return "delete article fail";
        }
    }

    //獲取最愛看板的文章
    @GetMapping("/getFavBoardArticles")
    public ResponseEntity<?> getFavBoardArticles(@RequestParam List<Integer> boardIds){
        try{
            // 檢查 boardIds 是否為空
            if (boardIds == null || boardIds.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList()); // 返回空列表
            }

            List<ArticleDTO> FavBoardArticles = userMapper.getFavBoardArticles(boardIds);

            FavBoardArticles.forEach(article -> {
                // 對每一篇文章進行處理
                // 使用 Jsoup 解析文章內容的 HTML
                Document doc = Jsoup.parse(article.getContent());

                // 提取前20個字作為摘要
                String text = doc.body().text();
                String excerpt = text.length() > 30 ? text.substring(0, 30) : text; // 取得前20個字
                article.setContent(excerpt);

                // 提取第一張圖片的 URL
                Element img = doc.select("img").first(); // 選擇第一個 <img> 標籤
                String imageUrl = img != null ? img.attr("src") : "";
                article.setFirstImgUrl(imageUrl);
            });

            return ResponseEntity.ok(FavBoardArticles);
        }catch (Exception e){
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred while get FavBoardArticles");
        }
    }

    // 獲取各版文章
    @GetMapping("/getSpecifyBoard/{boardName}")
    public ResponseEntity<?> getSpecifyBoard(@PathVariable String boardName) {

        try{
            List<ArticleDTO> SpecifyBoardArticles = userMapper.selectSpecifyBoard(boardName);
            System.out.println(SpecifyBoardArticles);

            SpecifyBoardArticles.forEach(article -> {
                // 對每一篇文章進行處理
                // 使用 Jsoup 解析文章內容的 HTML
                Document doc = Jsoup.parse(article.getContent());

                // 提取前20個字作為摘要
                String text = doc.body().text();
                String excerpt = text.length() > 30 ? text.substring(0, 30) : text; // 取得前20個字
                article.setContent(excerpt);

                // 提取第一張圖片的 URL
                Element img = doc.select("img").first(); // 選擇第一個 <img> 標籤
                String imageUrl = img != null ? img.attr("src") : "";
                article.setFirstImgUrl(imageUrl);
            });

            return ResponseEntity.ok(SpecifyBoardArticles);
        }catch (Exception e){
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred while get SpecifyBoardArticles");
        }
    }

    @GetMapping("/getArticleById/{articleId}")
    public ResponseEntity<?> getArticleById(@PathVariable int articleId) {
        try {
            // 避免查詢非法 ID，例如負數或 0
            if (articleId <= 0) {
                return ResponseEntity.badRequest().body("Invalid article ID");
            }

            // 根據 articleId 動態生成 Redis 鍵
            String redisKey = SPECIFIC_ARTICLE_KEY + "_" + articleId;

            //  從 Redis 查詢熱門文章緩存
            Object cachedArticle = getCache(redisKey);
            ArticleDTO specificArticle = null;

            // Redis 有資料
            if (cachedArticle != null) {
                // 快取的是「文章不存在」標記，直接回 404，避免打 DB（防穿透）
                if (NULL_ARTICLE_CACHE_VALUE.equals(cachedArticle)) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Article not found.");
                }
                // 轉換為 ArticleDTO
                specificArticle = objectMapper.convertValue(cachedArticle, ArticleDTO.class);
            } else {
                specificArticle = userMapper.selectArticleById(articleId);
                if (specificArticle == null) {
                    setCache(redisKey, NULL_ARTICLE_CACHE_VALUE, 5, TimeUnit.MINUTES);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Article not found.");
                }
                // 將結果存入 Redis 並設置過期時間
                setCache(redisKey, specificArticle, 30, TimeUnit.MINUTES);
            }

            return ResponseEntity.ok(specificArticle);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error occurred while getting article by ID");
        }
    }


    @PostMapping("/incrementLove/{articleId}")
    public ResponseEntity<?> incrementArticleLove(@PathVariable int articleId) {
        try {
            int result = userMapper.incrementArticleLove(articleId);

            if (result > 0) {
                invalidateSpecificArticleCache(articleId);
                return ResponseEntity.ok("Article love count incremented successfully.");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Article not found.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred while incrementing love count.");
        }
    }

    @PostMapping("/decrementLove/{articleId}")
    public ResponseEntity<?> decrementArticleLove(@PathVariable int articleId) {
        try {
            int result = userMapper.decrementArticleLove(articleId);

            if (result > 0) {
                invalidateSpecificArticleCache(articleId);
                return ResponseEntity.ok("Article love count decremented successfully.");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Article not found.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error occurred while decrementing love count.");
        }
    }

    //推薦看板的相關資料
    @GetMapping("/getRecommendBoards")
    public ResponseEntity<?> getRecommendBoards() {
        try {
            List<Board> boards = userMapper.selectRecommendBoards();
            return ResponseEntity.ok(boards);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to get recommend boards");
        }
    }

    //所有看板的相關資料
    @GetMapping("/getAllBoards")
    public ResponseEntity<?> getAllBoards() {

        try {
            // 先從 Redis 查詢熱門文章緩存
            List<Board> allBoards =  (List<Board>) getCache(ALL_BOARDS_KEY);

            if(allBoards == null){
                allBoards = userMapper.selectAllBoards();
                //存入緩存
                setCache(ALL_BOARDS_KEY, allBoards, 60, TimeUnit.DAYS);
            }

            return ResponseEntity.ok(allBoards);
        } catch (Exception e) {
            logger.error("Failed to get all boards",e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to get all boards");
        }
    }

    //取得用戶發的文
    @GetMapping("/getArticlesByUserId")
    public ResponseEntity<?> getArticlesByUserId(@RequestParam int userId) {
        try {
            List<ArticleDTO> articles = userMapper.getArticlesByUserId(userId);

            articles.forEach(article -> {
                // 對每一篇文章進行處理
                // 使用 Jsoup 解析文章內容的 HTML
                Document doc = Jsoup.parse(article.getContent());

                // 提取前20個字作為摘要
                String text = doc.body().text();
                String excerpt = text.length() > 30 ? text.substring(0, 30) : text; // 取得前20個字
                article.setContent(excerpt);

                // 提取第一張圖片的 URL
                Element img = doc.select("img").first(); // 選擇第一個 <img> 標籤
                String imageUrl = img != null ? img.attr("src") : "";
                article.setFirstImgUrl(imageUrl);
            });

            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to get ArticlesByUserId");
        }
    }

    @GetMapping("/suggest")
    public List<String> suggestTitles(@RequestParam String keyword) {
        return userMapper.suggestTitles(keyword);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchArticles(@RequestParam String keyword) {
        List<ArticleDTO> articles = userMapper.searchByTitleKeyword(keyword);

        articles.forEach(article -> {
            // 對每一篇文章進行處理
            // 使用 Jsoup 解析文章內容的 HTML
            Document doc = Jsoup.parse(article.getContent());

            // 提取前20個字作為摘要
            String text = doc.body().text();
            String excerpt = text.length() > 30 ? text.substring(0, 30) : text; // 取得前20個字
            article.setContent(excerpt);

            // 提取第一張圖片的 URL
            Element img = doc.select("img").first(); // 選擇第一個 <img> 標籤
            String imageUrl = img != null ? img.attr("src") : "";
            article.setFirstImgUrl(imageUrl);
        });

        return ResponseEntity.ok(articles);
    }

    private Object getCache(String key) {
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            logger.warn("Redis get failed, fallback to DB. key={}", key, e);
            return null;
        }
    }

    private void setCache(String key, Object value, long timeout, TimeUnit unit) {
        try {
            // 設定 Redis Key 的過期時間
            redisTemplate.opsForValue().set(key, value, getJitteredTimeout(timeout), unit);
        } catch (Exception e) {
            logger.warn("Redis set failed, return DB data directly. key={}", key, e);
        }
    }

    // 產生隨機過期時間
    private long getJitteredTimeout(long timeout) {
        int jitterPercent = Math.max(cacheTtlJitterPercent, 0);
        long jitter = timeout * jitterPercent / 100;

        if (jitter <= 0) {
            return timeout;
        }

        return timeout + ThreadLocalRandom.current().nextLong(jitter + 1);
    }

    private void deleteCache(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            logger.warn("Redis delete failed. key={}", key, e);
        }
    }

    private void invalidateArticleCaches(Integer articleId) {
        deleteCache(POPULAR_ARTICLES_KEY);
        deleteCache(LATEST_ARTICLES_KEY);

        if (articleId != null) {
            invalidateSpecificArticleCache(articleId);
        }
    }

    private void invalidateSpecificArticleCache(int articleId) {
        deleteCache(SPECIFIC_ARTICLE_KEY + "_" + articleId);
    }

}
