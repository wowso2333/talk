import { useEffect } from 'react';
import { searchKeyWord, getFavBoardArticles, incrementArticleLove, decrementArticleLove
         ,incrementMessageLove, decrementMessageLove, getFavoriteBoardId, getArticleById, getMessagesByArticleId, addMessage
        } from './api/TalksApiService';
import './css/MainPage.css'
import React, { useState } from 'react';
import { useAuth } from './security/AuthContext';
import { Dropdown } from 'react-bootstrap';
import {Link} from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGratipay } from '@fortawesome/free-brands-svg-icons';
import Sidebar from './SidebarComponent';
import AdvertiseComponent from './AdvertiseComponent'
import { Modal, Button, Form } from 'react-bootstrap'; // 引入模態視窗必要組件
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import ArticleModalComponent from './ArticleModalComponent'; // 引入 ArticleModal 組件
import { useLocation } from 'react-router-dom';

export default function SearchResultComponent() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const keyword = searchParams.get('title');

    const authContext = useAuth();
    const userId = authContext.userId
    const [articles, setArticles] = useState([])

    const [showModal, setShowModal] = useState(false)
    const [selectedArticle, setSelectedArticle] = useState(null)
    const [selectedMessage, setSelectedMessage] = useState(null)

    const [articleLiked, setArticleLikedLiked] = useState({}); // 文章是否已點擊愛心
    const [messageLiked, setMessageLiked] = useState({}); //  留言是否已點擊愛心
    const [comment, setComment] = useState(''); //輸入框的內容
    

    // 開啟模態視窗
    const handleShow = async(articleId) => {
        try{
            const article = await getArticleById(articleId)// 用id查詢文章
            const message = await getMessagesByArticleId(articleId) // 查詢該文的留言
            setSelectedArticle(article); //把內容傳給模組
            setSelectedMessage(message)
            setShowModal(true); // 模組設為可見

        }catch(error){
            console.error('fail to filter getArticleById', error)
        }
    };

    // 關閉模態視窗
    const handleClose = () => {
        setShowModal(false);
        setSelectedArticle(null);
    };

    useEffect(() => {

        const fetchArticles = async () => {
            if (!keyword) return;
            try {
                const data = await searchKeyWord(keyword);
                setArticles(data);
            } catch (error) {
                console.error('fail to filter article', error);
            }
        };
    
        // 初次加載時調用
        fetchArticles();
    
        // 設置每30秒調用一次的定時器
        const intervalId = setInterval(() => {
            fetchArticles();
        }, 30000); // 每 30 秒
    
        // 在組件卸載或 `condition` 變更時清除定時器
        return () => clearInterval(intervalId);
    
    }, [keyword]);


    // 文章愛心按鈕
    const handleClick = async (id) => {
        try {
            const updatedArticles = [...articles]; 

            // 尚未點愛心，增加愛心數量 +1
            if(!articleLiked[id]){
                await incrementArticleLove(selectedArticle.articleId) 
                //模態視窗
                selectedArticle.love += 1 

                //主頁兩個列表
                updatedArticles.forEach((article) => { 
                    if(article.articleId === id){
                        article.love += 1
                    }
                })

            // 愛心已點，則增加愛心 -1
            }else{
                await decrementArticleLove(selectedArticle.articleId);      
                selectedArticle.love -= 1      

                updatedArticles.forEach((article) => {
                    if(article.articleId === id){
                        article.love -= 1
                    }
                })       
       
            }

            // 更新 articles 狀態
            setArticles(updatedArticles);

            //更改愛心狀態
            setArticleLikedLiked(prevLikeArticles => ({
                ...prevLikeArticles,
                [id]:!prevLikeArticles[id]
            }))

        } catch (error) {
            console.error('Error updating article like:', error); // 輸出錯誤信息
        } 
    };

    // 留言愛心按鈕
    const handleMessageLove = async(id, index) => {
        try{
            if(!messageLiked[id]){ // 尚未點愛心，點擊後增加
                await incrementMessageLove(id)
                selectedMessage[index].love += 1

            }else{
                await decrementMessageLove(id)
                selectedMessage[index].love -= 1
            }
            //更改愛心狀態
            setMessageLiked(prevLikeMessages => ({
                ...prevLikeMessages,
                [id]:!prevLikeMessages[id]
            }))

        }catch(error){
            console.log('Error updating message like:', error)
        }
    }

    // 當輸入內容改變時，更新 state
    const handleInputChange = (e) => {
        setComment(e.target.value);
    };

    const handleMessageSubmit = async() => {
        try{     

            //檢查是否為空
            if (comment.trim() === '') {
            alert('請輸入內容');
            return;
            }

            const message = {
                articleId:selectedArticle.articleId, 
                userId:userId, 
                content:comment
            }

            await addMessage(message)
            alert('add message success')

        }catch(error){
            console.log('Error add message:', error)
        }

        setComment(''); // 提交後清空輸入框

        // 重新抓取該文章的留言，刷新留言列表
        const updatedMessages = await getMessagesByArticleId(selectedArticle.articleId);
        setSelectedMessage(updatedMessages);
    };

    // 格式化redis傳來的時間
    function formatTime(timeArray) {
        const [year, month, day, hour, minute, second] = timeArray;
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return formattedDate;
    }
    

    return (
            <div className='container-fluid mainPage_container justify-content-center'>
                <div className='row h-100 mainPage_row mx-auto'>

                    {/* 看板區 */}
                    <div className='col-2 pe-4'>
                        
                    </div>

                    {/* 文章展示區 */}
                    <div className='col-8 bg-white white_area p-4 no-scrollbar' style={{ overflowY : 'scroll' }}>
                        <div className='py-2 px-4'>

                            {/* 選項單 */}
                            <nav>
                                <div class="nav nav-tabs" id="nav-tab" role="tablist">
                                    <button className="nav-link active edit_title" id="nav-home-tab" data-bs-toggle="tab" data-bs-target="#nav-home" type="button" role="tab" aria-controls="nav-home" aria-selected="true">Popular</button>
                                    <button className="nav-link edit_title" id="nav-profile-tab" data-bs-toggle="tab" data-bs-target="#nav-profile" type="button" role="tab" aria-controls="nav-profile" aria-selected="false">Attract</button>
                                </div>
                            </nav>

                            {/* 選項一 : 文章 */}
                            <div className="tab-content" id="nav-tabContent">
                                <div className="tab-pane fade show active" id="nav-home" role="tabpanel" aria-labelledby="nav-home-tab">
                                    <div className="mt-4">

                                        {/* 列出所有文章 */}
                                        {Array.isArray(articles) && articles.length > 0 ? articles.map(
                                            (article) => (
                                                <div key = 
                                                    {article.articleId} 
                                                    className='d-flex border-bottom' 
                                                    style={{ height: 'auto' }}
                                                    onClick={() => handleShow(article.articleId)} // 點擊文章時顯示模態視窗
                                                >
                                                    <div className='py-3'>

                                                        <div className='mb-2 mainPage_gray h5'>
                                                            <span>{ article.board }</span>
                                                            <span className='mainPage_spaceTab'> · </span>

                                                            <span>{ article.username }</span>
                                                            <span className='mainPage_spaceTab'> · </span>

                                                            <span>{formatTime(article.time)}</span>
                                                        </div>

                                                        <div className='mt-3 mb-3 fw-bold h2 mainPage_deepGray fs-3'>{article.title}</div>

                                                        <h5 className='mb-3 mainPage_deepGray'>
                                                            {article.firstImgUrl.trim() !== ''
                                                                ? `${article.content.substring(0, 38)}...`
                                                                : `${article.content}...`}
                                                        </h5>

                                                        <div className="d-flex align-items-center">
                                                            <FontAwesomeIcon icon={faGratipay} color="#fa3b2ae5" className='mainPage_iconSize'/>
                                                            <h5 className="ms-1 mainPage_gray m-0" style={{ lineHeight: '25px' }}>{article.love}</h5>
                                                            <i className="ms-4 bi bi-chat-heart-fill mainPage_Blue mainPage_iconSize"></i>
                                                            <h5 className="ms-1 mainPage_gray m-0" style={{ lineHeight: '25px' }}>{article.messageCount}</h5>
                                                        </div>
                                                    </div>

                                                    { article.firstImgUrl.trim() && 
                                                        <div className='d-flex align-items-start ms-auto pb-3 pt-5' style={{ height: 'auto' }}>
                                                            <img src={article.firstImgUrl}
                                                                alt={article.firstImgUrl}
                                                                className='mainPage_ArticleImg'
                                                            />
                                                        </div>}
                                                </div>
                                            )
                                        ):(
                                                <div className="text-center text-muted py-5">
                                                    無相關文章
                                                </div>
                                        )}

                                        {/* 模態視窗 */}
                                        {selectedArticle &&               
                                            <ArticleModalComponent
                                            showModal={showModal}
                                            handleClose={handleClose}
                                            selectedArticle={selectedArticle}
                                            selectedMessage={selectedMessage}
                                            articleLiked={articleLiked}
                                            handleClick={handleClick}
                                            handleMessageLove={handleMessageLove}
                                            comment={comment}
                                            handleInputChange={handleInputChange}
                                            handleMessageSubmit={handleMessageSubmit}
                                            messageLiked={messageLiked}
                                        />}
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 廣告區 */}
                    <div className='col-2 ps-4'> 
                      
                    </div>

                </div>
            </div>
    )
}