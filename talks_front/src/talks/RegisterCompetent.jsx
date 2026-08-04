import React, { useState } from 'react';
import './css/Register.css'; // 這裡可以包含自定義樣式
import { useAuth } from './security/AuthContext';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { jsonApiClient } from './api/jsonApiClient';
import { register } from './api/TalksApiService';


export default function RegisterComponent() {
    const authContext = useAuth();
    const login = authContext.login
    const navigate = useNavigate();

    const [avatar, setAvatar] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [duplicate, setDuplicate] = useState(false)

    // 頭像圖片的列表
    const avatars = [
        { avatarName:'yellowET', src: 'https://pub-a6e3ecd4dae44a458f3b709c3bcaf948.r2.dev/avat2/yellowPinkET.png' },
        { avatarName:'Hedgehog', src: 'https://pub-a6e3ecd4dae44a458f3b709c3bcaf948.r2.dev/avat2/hedgehog.png' },
        { avatarName:'Chimpanzees', src: 'https://pub-a6e3ecd4dae44a458f3b709c3bcaf948.r2.dev/avat2/Chimpanzees.png'},
        { avatarName:'flower', src: 'https://pub-a6e3ecd4dae44a458f3b709c3bcaf948.r2.dev/avat2/flower.png' },
        { avatarName:'pinkET', src: 'https://pub-a6e3ecd4dae44a458f3b709c3bcaf948.r2.dev/avat2/deepPinkET.png' },
        { avatarName:'penguin_l', src: 'https://pub-a6e3ecd4dae44a458f3b709c3bcaf948.r2.dev/avat2/penguin_l.png' },
        { avatarName:'penguin_r', src: 'https://pub-a6e3ecd4dae44a458f3b709c3bcaf948.r2.dev/avat2/penguin_r.png'},
    ];

    async function handleSubmit(event) {
        event.preventDefault(); // 阻止表單提交的默認行為
        
        const user = {
            "username" : username,
            "password" : password,
            "role" : 'ROLE_USER',
            "enabled" : true,
            "avatar" : avatar
        }

        try {
            //帳密不得為空
            if(username && password){
                const message = await register(user); // 使用 register 請求api

                if(message === 'register success!'){
                    await login(username, password)
                    navigate('/mainPage');
                }else{
                    setDuplicate(true) // 帳號名重複
                }
            }
        } catch (error) {
            console.error('Error registering user:', error);
        }
    }

    return (
        <div className="container-fluid bg_light_purple d-flex align-items-center justify-content-center" style={{ height: "100vh" }}>
            <div className="container r_container_padding flex-column align-items-center justify-content-center">
                <form className='row w-100 bg-light special_padding mb-5 top_b color-p fw-bolder pixel_font h2' onSubmit={handleSubmit}>
                    <div className='col-6 mb-2'>
                        <label htmlFor="InputUsername" className="form-label mb-3">Username</label>
                        <input
                            type="text"
                            value={username}
                            className="h-50 form-control mini_border bg_grey no_border"
                            id="username"
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className='col-6 mb-2'>
                        <label htmlFor="InputPassword" className="form-label mb-3">Password</label>
                        <input
                            type="password"
                            value={password}
                            className="h-50 form-control mini_border no_border bg_grey"
                            id="password"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className='col-12 mt-5'>
                        <label htmlFor="select-avatar" className="form-label mb-3">Select Head Portrait</label>
                    </div>
                    <div className="col-12 d-flex py-2 justify-content-around avatar-img avatar-bg avatar_border">
                        {avatars.map((avatar) => (
                            <button key={avatar.avatarName} type="button" className="btn btn-avatar avatar-bg avatar_border" onClick={() => setAvatar(avatar.src)}>
                                <img src={avatar.src} alt={avatar.avatarName} className="avatar-img" />
                            </button>
                        ))}
                    </div>
                </form>
                <div className='row w-100 mb-2 mt-5 align-self-center justify-content-center'>
                    <div className="col-3 align-self-end justify-content-start">
                        <button type="submit" onClick={handleSubmit} className="btn btn-w p-0 button_w mini_border color-p fw-bolder t_size bg-y">Register</button>
                    </div>
                     
                </div>
                <div className='row w-100 mt-5 align-self-center justify-content-center'>
                    { duplicate && <div className='alert alert-warning'  role='alert'>Username name already exists!</div> }
                </div>
            </div>
        </div>
    )
    
}
