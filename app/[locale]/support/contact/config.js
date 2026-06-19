export const contactList = ({ CONFIG, LANG }) => {
  return [
    {
      title: LANG["www.company_contact.question_consulting"],
      content: CONFIG["common.base"]?.customer_service,
      type: "email",
    },
    {
      title: LANG["www.company_contact.contact_form"],
      content: "contact_form",
      type: "modal",
    },
    {
      title: LANG["www.company_contact.contact_number"],
      content: CONFIG["common.base"]?.work_phone,
      type: "text",
    },
    {
      title: LANG["www.company_contact.company_address"],
      content: CONFIG["common.base"]?.work_location,
      type: "text",
    },
    {
      title: LANG["www.company_contact.operating_hours"],
      content: CONFIG["common.base"]?.work_time,
      type: "text",
    },
  ];
};
