import { filter } from 'lodash'
import JobFamilyService from '../../services/JobFamilyService'
import RoleGuidanceService from '../../services/RoleGuidanceService'

export default async function handler(req, res) {
  let roles = []
  const categories = await JobFamilyService.getJobFamilyList(process.env.HOST_URL)
  categories.forEach( category => {
    roles.push(...category.roles)
  })

  roles = await Promise.all(roles.map( async function(role) {
    const roleData = await RoleGuidanceService.getGuidance(role.id)
    role.error = roleData.validation_checks.has_errors
    role.error_messages = roleData.validation_checks.major_error_messages
    return role
  }))

  res.status(200).json( filter(roles, { error: true }) )
}
