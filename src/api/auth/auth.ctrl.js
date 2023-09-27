import Dotenv from 'dotenv';
Dotenv.config();
import Joi from 'joi';
import { generateToken } from '../../lib/jwtMiddleware.js';

const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

/*
로그인
POST /api/auth/login
{
  "username": "test"
  "password": "password"
}
*/
export const login = (req, res) => {
  const { username, password } = req.body;

  // validation
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(req.body);
  if (result.error) {
    return res.status(401).json(result.error);
  }

  // admin 계정이 맞는지 확인
  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ error: 'worng username' });
  }

  // 패스워드 맞는지 확인
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'worng password' });
  }

  const token = generateToken();
  res.cookie('access_token', token, {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
  });

  return res.send({ token });
};

/*
체크
GET /api/auth/check
*/
export const check = (req, res) => {
  const { user } = res.locals;
  if (!user) {
    return res.status(401).json({ error: 'user empty' });
  }
  return res.json(user);
};

/*
로그아웃
GET /api/auth/logout
*/
export const logout = (req, res) => {
  res.clearCookie('access_token');
  return res.json({ message: 'logout' });
};
