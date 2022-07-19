import RoleGuidanceService from '../../../../services/RoleGuidanceService'
import { find, isEmpty, kebabCase, lowerCase, omitBy } from 'lodash'

export default async function handler(req, res) {
  const role = await RoleGuidanceService.getGuidance(req.query.roleId)

  let data = {
    id: role.id,
    title: role.title,
    skills: []
  }

  let _skills = {}

  role.levels.forEach( level => {
    level.skills.forEach( skill => {
      let name = `${skill.name} as a ${role.title}`
      let id = kebabCase(name)

      if (!_skills[id]) {
        let skillDesc = find( role.introduction.skills, { name: skill.name } )
        skillDesc = skillDesc ? skillDesc.description : null

        _skills[id] = {
          name: name,
          type: "skill",
          description: skillDesc,
          author_id: "govuk",
          author_name: "GOVUK DDAT Framework",
          author_logo: "https://assets.trackprogress.io/partners/govuk/branding/govuk-apple-touch-icon-180x180.png",
          author_description: "The DDAT Capability Framework describes the job roles in the Digital, Data and Technology (DDaT) Profession and provides details of the skills needed to work at each role level.\n",
          learn_more_url: role.govuk_url,
          banner_url: "https://assets.trackprogress.io/partners/govuk/banner/gds-accessibility-lab.jpeg", // needs to be changed
          last_updated_at: role.last_updated_at,
          what: skillDesc,
          why: `This will help you understand and learn ${skill.name} as a ${role.title}.`,
          resources: [
            {
              label: `${role.title} (DDAT Framework)`,
              href: role.govuk_url,
            }
          ],
          milestones: {awareness: {}, working: {}, practitioner: {}, expert: {}},
        }
      }

      _skills[id].milestones[ lowerCase(skill.level) ] = {
        name: skill.level,
        description: skill.level_requirements.join(' '),
        checklist: skill.requirements.map( requirement => ({
          summary: requirement,
        }) )
      }
    })
  })

  Object.values(_skills).forEach( skill => {
    skill.milestones = Object.values(omitBy(skill.milestones, (v) => isEmpty(v)))
    data.skills.push(skill)
  } )

  res.status(200).json( data )
}
