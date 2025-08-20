import axios from "axios";
import { jsonApiClient } from "./jsonApiClient";
import { parsePath } from "react-router-dom";

export const register = async (user) => {
    try {
        const response = await jsonApiClient.post(`/register`, user);
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

export const getSignedUrl = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await axios.post('http://localhost:8080/cloud/uploadImg', formData, {
            headers: {
                'Content-Type': 'multipart/form-data' // 這裡會自動處理
            },
        });
        return response.data; // 返回圖片的 URL
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export async function deleteImage(imageUrl) {
    try {
        const response = await axios.delete('http://localhost:8080/cloud/deleteImg', {
            params: {
                imageUrl: imageUrl
            }
        });
        return response.data; // 返回 API 回應的數據

    } catch (error) {
        console.error('Failed to delete image:', error);
        throw error; // 重新拋出錯誤，方便調用方處理
    }
}

export async function getUserInformation(username){
    try{
        const response = await axios.get('http://localhost:8080/article/getUerInformation',{
            params:{
                username : username
            }
        });
        return response.data;

    }catch(error){
        console.log('Failed to getAvatarAndUerId:', error)
        throw error;
    }
}

export async function addArticle(article){
    try{
        const response = await axios.post('http://localhost:8080/article/add', article)
        return response.data;

    }catch(error){
        console.log('Failed to addArticle:', error)
        throw error;
    }
}

// 加入收藏
export async function addFavoriteBoard(userId, boardId){
    try{
        const response = await axios.post('http://localhost:8080/user/addFavoriteBoard', { 
            userId : userId,  
            boardId : boardId
        })
        return response.data
    }catch(error){
        console.log('Failed to addToFavorites:', error)
        throw error;
    }
};

// 取消收藏
export async function removeFavoriteBoard(userId, boardId){
    try{
        const response = await axios.delete(`http://localhost:8080/user/removeFavoriteBoard`, {
            params: {
                userId: userId,
                boardId: boardId
            }
        })
        
        return response.data
    }catch(error){
        console.log('Failed to removeFromFavorites:', error)
        throw error
    }
};

export async function getPopularArticle(){
    try{
        const response = await axios.get('http://localhost:8080/article/popular')
        return response.data
    }catch(error){
        console.log('Failed to getPopularArticle:', error)
        throw error
    }
}

export async function getLatestArticle(){
    try{
        const response = await axios.get('http://localhost:8080/article/latest')
        return response.data
    }catch(error){
        console.log('Failed to getPopularArticle:', error)
        throw error
    }
}

export async function getFavoriteBoardId(userId){
    try{
        const response = await axios.get('http://localhost:8080/user/getFavoriteBoardId', {
          params : {
            userId : userId
        }})
        
        return response.data
    }catch(error){
        console.log('Failed to getFavoriteBoardId:', error)
        throw error
    }
}

export async function getFavBoardArticles(boardIds) {
    try {
        const response = await axios.get('http://localhost:8080/article/getFavBoardArticles', {
            params: { 
                boardIds: boardIds
            },
            paramsSerializer: params => {
                // 確保 boardIds 是陣列並且不為 null 或 undefined
                const validBoardIds = Array.isArray(params.boardIds) ? params.boardIds : [];
                return `boardIds=${validBoardIds.join(',')}`;
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Failed to getFavBoardArticles:', error);
        throw error;
    }
}

// 獲取指定版的文章
export async function getSpecifyBoardArticle(boardName) {
    try {
        const response = await axios.get(`http://localhost:8080/article/getSpecifyBoard/${boardName}`);
        return response.data;
    } catch (error) {
        console.error('Failed to getSpecifyBoardArticles:', error);
        throw error;
    }
}


// 獲取指定文章
export async function getArticleById(articleId) {
    try {
        const response = await axios.get(`http://localhost:8080/article/getArticleById/${articleId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to getArticleById:', error);
        throw error;
    }
}

// 增加文章的 love
export async function incrementArticleLove(articleId) {
    try {
        const response = await axios.post(`http://localhost:8080/article/incrementLove/${articleId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to incrementArticleLove:', error);
        throw error;
    }
}

// 減少文章的 love
export async function decrementArticleLove(articleId) {
    try {
        const response = await axios.post(`http://localhost:8080/article/decrementLove/${articleId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to incrementArticleLove:', error);
        throw error;
    }
}

// 新增留言
export async function addMessage(message) {
    try {
        const response = await axios.post('http://localhost:8080/message/addMessage', message
        );
        return response.data;
    } catch (error) {
        console.error('Failed to addMessage:', error);
        throw error;
    }
}

// 新增留言愛心
export async function incrementMessageLove(messageId) {
    try {
        const response = await axios.post(`http://localhost:8080/message/incrementMessageLove/${messageId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to incrementMessageLove:', error);
        throw error;
    }
}

// 新增留言愛心
export async function decrementMessageLove(messageId) {
    try {
        const response = await axios.post(`http://localhost:8080/message/decrementMessageLove/${messageId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to incrementMessageLove:', error);
        throw error;
    }
}

// 根據文章 ID 獲取留言
export async function getMessagesByArticleId(articleId) {
    try {
        const response = await axios.get(`http://localhost:8080/message/getMessagesByArticleId/${articleId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to getMessagesByArticleId:', error);
        throw error;
    }
}

//取得推薦看板資料
export async function getRecommendBoardsInformation() {
    try {
        const response = await axios.get('http://localhost:8080/article/getRecommendBoards');
        return response.data;
    } catch (error) {
        console.log('Failed to getRecommendBoards:', error);
        throw error;
    }
}

//取得所有看板資料
export async function getAllBoardsInformation() {
    try {
        const response = await axios.get('http://localhost:8080/article/getAllBoards');
        return response.data;
    } catch (error) {
        console.log('Failed to getRecommendBoards:', error);
        throw error;
    }
}

//取得頭像
export async function getAvatar(userId) {
    try {
        const response = await axios.get('http://localhost:8080/article/getAvatarUrl',{
            params: { 
                userId: userId
        }
        });
        return response.data;
    } catch (error) {
        console.log('Failed to getAllBoards:', error);
        throw error;
    }
}

//取得用戶發的文
export async function getArticlesByUserId(userId) {
    try {
        const response = await axios.get('http://localhost:8080/article/getArticlesByUserId',{
            params: { 
                userId: userId
        }
        });
        return response.data;
    } catch (error) {
        console.log('Failed to getAllBoards:', error);
        throw error;
    }
}

//刪除文章
export async function deleteArticle(articleId) {
    try {
        const response = await axios.delete('http://localhost:8080/article/delete', {
            params: {
                articleId: articleId
            }
        });
        return response.data; // 返回 API 回應的數據

    } catch (error) {
        console.error('Failed to delete image:', error);
        throw error; // 重新拋出錯誤，方便調用方處理
    }
}

//取得用戶追蹤看板資訊
export async function getFavoriteBoardInfo(userId) {
    try {
        const response = await axios.get('http://localhost:8080/user/getFavoriteBoardInfo',{
            params: { 
                userId: userId
        }
        });
        return response.data;
    } catch (error) {
        console.log('Failed to getAllBoards:', error);
        throw error;
    }
}

//更改密碼
export async function changePassword(password, userId){
    try{
        const response = await axios.post('http://localhost:8080/user/updatePassword', { 
            userId : userId,  
            password : password
        })
        return response.data
    }catch(error){
        console.log('Failed to changePassword:', error)
        throw error;
    }
};

//刪除帳號
export async function deleteAccount(userId) {
    try {
        const response = await axios.delete('http://localhost:8080/user/deleteAccount', {
            params: {
                userId: userId
            }
        });
        return response.data; // 返回 API 回應的數據

    } catch (error) {
        console.error('Failed to delete account:', error);
        throw error; // 重新拋出錯誤，方便調用方處理
    }
}

//更改密碼
export async function updateArticle(article){
    try{
        const response = await axios.post('http://localhost:8080/article/edit', article)
        return response.data
    }catch(error){
        console.log('Failed to update article:', error)
        throw error;
    }
};

export const executeAuthenticationService = async(username, password) => {
    const params = {
        username: username,
        password: password
    };

    return axios.post('http://localhost:8080/login', params, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        },
    });
}

// 自動補字：根據關鍵字建議標題
export async function suggestTitles(keyword) {
    try {
        const response = await axios.get('http://localhost:8080/article/suggest', {
            params: { keyword }
        });
        return response.data; // 回傳字串陣列
        
    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        throw error;
    }
}

export async function searchKeyWord(keyword) {
    try {
      const response = await axios.get('http://localhost:8080/article/search', {
        params: { keyword }
      });
      return response.data;
    } catch (error) {
      console.error('搜尋錯誤：', error);
      return [];
    }
}

// 贊助本站
export async function donate(articleId = 0, amount) {
  try {
    const res = await axios.post('http://localhost:8080/donate/create', null, {
      params: { articleId, amount } // 後端只收這兩個參數
    });
    return res.data; // HTML 字串
  } catch (e) {
    console.error('建立贊助訂單失敗：', e);
    throw e;
  }
}
