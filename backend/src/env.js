import { cleanEnv, str, port, num } from 'envalid'
import dotenv from 'dotenv'

dotenv.config()

const env = cleanEnv(process.env, {
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_USER: str({ default: 'postgres' }),
  DB_PASSWORD: str({ default: 'postgres' }),
  DB_NAME: str({ default: 'lume' }),
  PORT: port({ default: 4000 }),
  CLIENTE_ORIGEM: str({ default: 'http://localhost:5173' }),
  BACKEND_URL: str({ default: 'http://localhost:4000' }),
  JWT_SECRET: str({ devDefault: 'segredo-dev-inseguro-apenas-para-desenvolvimento' }),
  MP_ACCESS_TOKEN: str({ default: '' }),
})

export default env
