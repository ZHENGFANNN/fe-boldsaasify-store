export const contactList = ({ CONFIG, LANG }) => {
  return [
    {
      title: LANG['www.company_contact.question_consulting'],
      content: CONFIG['company.basic.customer_service'],
      type: 'email',
    },
    {
      title: LANG['www.company_contact.recruitment'],
      content: CONFIG['company.basic.recruitment'],
      type: 'email',
    },
    {
      title: LANG['www.company_contact.contact_number'],
      content: CONFIG['company.basic.work_phone'],
      type: 'text',
    },
    {
      title: LANG['www.company_contact.technical_cooperation'],
      content: '/company/technology',
      type: 'href',
    },
    {
      title: LANG['www.company_contact.market_collaboration'],
      content: '/company/market',
      type: 'href',
    },
    {
      title: LANG['www.company_contact.supplier_cooperation'],
      content: '/company/supplier',
      type: 'href',
    },
    {
      title: LANG['www.company_contact.company_address'],
      content: CONFIG['company.basic.work_location'],
      type: 'text',
    },
    {
      title: LANG['www.company_contact.operating_hours'],
      content: CONFIG['company.basic.work_time'],
      type: 'text',
    },
  ]
}
