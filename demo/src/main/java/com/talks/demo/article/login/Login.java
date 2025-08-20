package com.talks.demo.article.login;

import com.talks.demo.article.security.JwtUtil;
import com.talks.demo.articleDao.dao.UserMapper;
import com.talks.demo.articleDao.pojo.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
public class Login {
    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;

    private static final Logger logger = LoggerFactory.getLogger(Login.class);

    @PostMapping("/register")
    public String addUser(@RequestBody User user) {
        System.out.println(user);
        try {
            user.setEnabled(true); // 啟用帳號
            userMapper.register(user);;
            return "register success!";
        } catch (Exception e) {
            e.printStackTrace();
            return "Error occurred while register";
        }
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        try {
            logger.info("Entered /login!");
            String username = loginData.get("username");
            String password = loginData.get("password");

            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            String token = jwtUtil.generateToken(username);
            return ResponseEntity.ok(Collections.singletonMap("token", token));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "登入失敗：" + e.getMessage()));
        }
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong?";
    }
}
