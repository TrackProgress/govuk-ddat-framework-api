import GovukContentApiService from './GovukContentApiService'
import * as cheerio from 'cheerio'
import { upperFirst } from 'lodash'

const level_requirements = {
  awareness: [
    "You know about the skill and have an appreciation of how it is applied in the environment.",
  ],
  working: [
    "You can apply your knowledge and experience of the skill, including tools and techniques.",
    "You can adopt those most appropriate for the environment.",
  ],
  practitioner: [
    "You know how to share your knowledge and experience of this skill with others, including tools and techniques.",
    "You can define those most appropriate for the environment.",
  ],
  expert: [
    "You have both knowledge and experience in the application of this skill.",
    "You are a recognised specialist and adviser in this skill including user needs, generation of ideas, methods and tools.",
    "You can lead or guide others in best-practice use.",
  ],
}

const RoleGuidanceService = {
  async getGuidance(roleId) {
    const content = await GovukContentApiService.getContentApi(`/guidance/${roleId}`)
    const $ = cheerio.load(content.details.body)
    let sections = $('h2')
    let roleLevels = []
    let introduction = this.getIntroSection($, $(sections).first())

    sections.slice(1, -1).each( (i, section) => {
      roleLevels.push( this.getRoleLevelData($, $(section)) )
    })

    let roleData = {
      id: content.content_id,
      title: content.title,
      description: content.description,
      govuk_url: `https://www.gov.uk/guidance/${roleId}`,
      last_updated_at: content.updated_at,
      introduction: introduction,
      levels: roleLevels,
    }

    return roleData
  },

  getIntroSection($, section) {
    let summary = []
    let skills = []

    section.next().next().find('li').each( (i, skill) => {
      summary.push( $(skill).text() )
    })

    let _skillsSection = summary.length
      ? section.next().next().next().next().next().find('li')
      : section.next().next().next().next().find('li')

    _skillsSection.each( (i, skill) => {
      skills.push( {
        name: $(skill).find('strong').text().replace('.', '').trim(),
        description: $(skill).text().split(".").slice(1).join(". ").trim(),
      } )
    })

    return {
      title: section.text(),
      summary_pretext: section.next().text(),
      summary: summary,
      skills_subheading: section.next().next().next().text(),
      skills: skills,
    }
  },

  getRoleLevelData($, section) {
    let data = {
      title: $(section).text(),
      skills: [],
      sub_roles: [],
    }

    let _nextSection = section.next()

    if (_nextSection.first().get(0).tagName === "p") {
      data.summary_pretext = _nextSection.text()
      data.summary = []

      if (_nextSection.next().get(0).tagName === "p") {
        data.summary_pretext += _nextSection.next().text()
        _nextSection = _nextSection.next()
      }

      _nextSection.next().find('li').each( (i, skill) => {
        data.summary.push( $(skill).text() )
      })

      _nextSection = data.summary.length ? _nextSection.next() : _nextSection
      _nextSection = _nextSection.next()
    }

    data.skills = _nextSection.next().find('li')

    let _skills = []
    data.skills.each( (i, skill) => {
      let skillsArray = $(skill).text().split(".").filter(n => n)
      let skillLevel = skillsArray[skillsArray.length - 1].match(/\(Skill level: (.*?)\)/)

      skillLevel = skillLevel[skillLevel.length - 1]

      _skills.push( {
        name: $(skill).find('strong').text().replace('.', '').trim(),
        requirements: skillsArray.slice(1, -1).map(n => n.trim() + "."),
        level: upperFirst(skillLevel),
        level_requirements: level_requirements[skillLevel],
      })
    })

    return {
      title: data.title,
      summary_pretext: data.summary_pretext,
      summary: data.summary,
      summary_posttext: data.summary_posttext,
      skills: _skills,
    }
  },
}

export default RoleGuidanceService
