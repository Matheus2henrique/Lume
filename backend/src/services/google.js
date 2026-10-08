import { OAuth2Client } from 'google-auth-library'
import env from '../env.js'

/**
 * Valida o ID token do Google Identity Services antes de confiar nele.
 *
 * A validação confere assinatura, expiração E a audiência (o token tem que
 * ter sido emitido para o NOSSO Client ID — token de outro projeto não passa).
 * Retorna o payload (sub, email, name, email_verified) ou lança um Error;
 * quando o servidor não está configurado, o erro carrega `naoConfigurado`.
 */
export async function verificarIdTokenGoogle(credential) {
  if (!env.GOOGLE_CLIENT_ID) {
    const erro = new Error('Login com Google não configurado (GOOGLE_CLIENT_ID vazio).')
    erro.naoConfigurado = true
    throw erro
  }

  const cliente = new OAuth2Client(env.GOOGLE_CLIENT_ID)
  const ticket = await cliente.verifyIdToken({
    idToken: String(credential),
    audience: env.GOOGLE_CLIENT_ID,
  })
  return ticket.getPayload()
}
