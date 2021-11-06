import RoleGuidanceService from '../../../services/RoleGuidanceService'

export default async function handler(req, res) {
  res.status(200).json( await RoleGuidanceService.getGuidance(req.query.roleId) )
}
