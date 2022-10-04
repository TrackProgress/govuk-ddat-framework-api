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
      validation_checks: {},
      title: content.title,
      description: content.description,
      govuk_url: `https://www.gov.uk/guidance/${roleId}`,
      last_updated_at: content.updated_at,
      introduction: introduction,
      levels: roleLevels,
    }

    roleData.validation_checks = this.validateData( roleData )

    return roleData
  },

  validateData( roleData ) {
    let error_messages = []
    let minor_error_messages = []

    let validations = {
      has_errors: false,
      major_error_messages: error_messages,
      minor_error_messages: minor_error_messages,
      title: roleData.title.length ? true : false,
      description: roleData.description.length ? true : false,
      last_updated_at: roleData.last_updated_at.length ? true : false,
      introduction: {
        title: roleData.introduction.title.length ? true : false,
        summary_pretext: roleData.introduction.summary_pretext.length ? true : false,
        summary_count: roleData.introduction.summary.length,
        summary: roleData.introduction.summary.length ? true : false,
        skills_subheading: roleData.introduction.skills_subheading.length ? true : false,
        skills_count: roleData.introduction.skills.length,
        skills: roleData.introduction.skills.map( (skill, index) => {
          let validation = {
            name_label: skill.name,
            name: skill.name.length ? true : false,
            description: skill.description.length ? true : false,
          }

          // validate introduction skills
          if ( !validation.name ) error_messages.push(`Name is missing for introduction.skills.${index}`)
          if ( !validation.description ) error_messages.push(`Description is missing for introduction.skills.${index}`)

          return validation
        })
      },
      levels_count: roleData.levels.length,
      levels: roleData.levels.map( (level, levelIndex) => {
        let validation = {
          title_label: level.title,
          title: level.title.length ? true : false,
          summary_pretext: level.summary_pretext && level.summary_pretext.length ? true : false,
          summary_count: level.summary && level.summary.length,
          summary: level.summary && level.summary.length ? true : false,
          skills_count: level.skills.length,
          skills: level.skills.map( (skill, levelSkillIndex) => {
            let validation = {
              name_label: skill.name,
              name: skill.name.length ? true : false,
              requirements_count: skill.requirements.length,
              requirements: skill.requirements.length ? true : false,
              level: skill.level.length ? true : false,
              level_requirements_count: skill.level_requirements.length,
              level_requirements: skill.level_requirements.length ? true : false,
            }

            // validate level skills
            if ( !validation.name ) error_messages.push(`name is missing for levels.${levelIndex}.skills.${levelSkillIndex}`)
            if ( !validation.requirements ) error_messages.push(`requirements is missing for levels.${levelIndex}.skills.${levelSkillIndex}`)
            if ( !validation.level ) error_messages.push(`level is missing for levels.${levelIndex}.skills.${levelSkillIndex}`)
            if ( !validation.level_requirements ) error_messages.push(`level_requirements is missing for levels.${levelIndex}.skills.${levelSkillIndex}`)

            return validation
          })
        }

        // validate level
        if ( !validation.title ) error_messages.push(`title is missing for levels.${levelIndex}`)
        if ( !validation.summary_pretext ) minor_error_messages.push(`summary_pretext is missing for levels.${levelIndex}`)
        if ( !validation.summary ) minor_error_messages.push(`summary is missing for levels.${levelIndex}`)
        if ( !validation.skills_count ) error_messages.push(`skills is missing for levels.${levelIndex}`)

        return validation
      })
    }

    // validate default meta
    if ( !validations.title ) error_messages.push(`title is missing`)
    if ( !validations.description ) error_messages.push(`description is missing`)
    if ( !validations.last_updated_at ) error_messages.push(`last_updated_at is missing`)

    // validate introduction
    if ( !validations.introduction.title ) error_messages.push(`title is missing for introduction`)
    if ( !validations.introduction.summary_pretext ) minor_error_messages.push(`summary_pretext is missing for introduction`)
    if ( !validations.introduction.summary ) minor_error_messages.push(`summary is missing for introduction`)
    if ( !validations.introduction.skills_subheading ) error_messages.push(`skills_subheading is missing for introduction`)
    if ( !validations.introduction.skills_count ) error_messages.push(`skills is missing for introduction`)

    validations.has_errors = error_messages.length ? true : false

    return validations
  },

  getIntroSection($, section) {
    let summary = []

    section.next().next().find('li').each( (i, skill) => {
      summary.push( $(skill).text() )
    })

    let skills = this.getSkills($)

    return {
      title: section.text(),
      summary_pretext: section.next().text(),
      summary: summary,
      skills_subheading: section.next().next().next().text(),
      skills: skills,
    }
  },

  getSkills($) {
    let skills = []
    let skillsNeededHeader = $("h3[id^='skills-needed-to-be']")
    let _skillsSection = skillsNeededHeader.next().next().find('li')

    _skillsSection.each( (i, skill) => {
      skills.push( {
        name: $(skill).find('strong').text().replace('.', '').trim(),
        description: $(skill).text().split(".").slice(1).join(". ").trim(),
      } )
    })

    return skills
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
