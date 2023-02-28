import RoleGuidanceService from '../../../../services/RoleGuidanceService'

export default async function handler(req, res) {
  const { roleId, debug } = req.query

  res.status(200).json( await RoleGuidanceService.getGuidance(roleId, debug === "true") )
}
