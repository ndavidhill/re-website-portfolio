import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'External URL',
      type: 'url',
      description: 'Optional. Links the client name on the home page.',
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'url'}},
})
