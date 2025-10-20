const pool = require('../../config/database-connection');
const crypto = require('crypto');

class UserInviteRepository {

  async createInvite({ organisationId, invitedEmail, invitedByUserId, expiresAt }) {
    try {
      const inviteId = crypto.randomUUID();
      const token = crypto.randomBytes(32).toString('hex');

      const query = `
        INSERT INTO organisation_invites (invite_id, organisation_id, invited_email, invited_by_user_id, token, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING invite_id, organisation_id, invited_email, invited_by_user_id, token, expires_at, accepted_at, revoked_at, created_at, updated_at
      `;

      const result = await pool.query(query, [inviteId, organisationId, invitedEmail, invitedByUserId, token, expiresAt]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create invite: ${error.message}`);
    }
  }

  async findByToken(token) {
    try {
      const query = `
        SELECT 
          oi.invite_id,
          oi.organisation_id,
          oi.invited_email,
          oi.invited_by_user_id,
          oi.token,
          oi.expires_at,
          oi.accepted_at,
          oi.revoked_at,
          o.organisation_name
        FROM organisation_invites oi
        JOIN organisation o ON oi.organisation_id = o.organisation_id
        WHERE oi.token = $1
      `;

      const result = await pool.query(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find invite by token: ${error.message}`);
    }
  }

  async listByOrganisation(organisationId) {
    try {
      const query = `
        SELECT invite_id, organisation_id, invited_email, invited_by_user_id, token, expires_at, accepted_at, revoked_at, created_at, updated_at
        FROM organisation_invites
        WHERE organisation_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to list invites: ${error.message}`);
    }
  }

  async revoke(inviteId, organisationId) {
    try {
      const query = `
        UPDATE organisation_invites
        SET revoked_at = NOW(), updated_at = NOW()
        WHERE invite_id = $1 AND organisation_id = $2 AND accepted_at IS NULL AND revoked_at IS NULL
        RETURNING invite_id, organisation_id, invited_email, invited_by_user_id, token, expires_at, accepted_at, revoked_at, created_at, updated_at
      `;
      const result = await pool.query(query, [inviteId, organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to revoke invite: ${error.message}`);
    }
  }

  async markAccepted(inviteId) {
    try {
      const query = `
        UPDATE organisation_invites
        SET accepted_at = NOW(), updated_at = NOW()
        WHERE invite_id = $1 AND accepted_at IS NULL AND revoked_at IS NULL
        RETURNING invite_id, organisation_id, invited_email, invited_by_user_id, token, expires_at, accepted_at, revoked_at, created_at, updated_at
      `;
      const result = await pool.query(query, [inviteId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to mark invite accepted: ${error.message}`);
    }
  }

  async deleteExpired() {
    try {
      const result = await pool.query('DELETE FROM organisation_invites WHERE expires_at < NOW() RETURNING invite_id');
      return result.rows.length;
    } catch (error) {
      throw new Error(`Failed to delete expired invites: ${error.message}`);
    }
  }
}

module.exports = new UserInviteRepository();


