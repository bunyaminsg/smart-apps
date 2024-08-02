/*
 * Config file for client settings and external links
 */

export const CONFIG = {
  clientSettings: {
    iss: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/',
    redirectUri: 'http://localhost:4200/callback',
    clientId: '43a60ffa-242a-4bbe-bb17-97666be7189e',
    scope: 'patient/*.*'
  },
  externalLinks: [
    { name: 'SMART Health IT', url: 'https://apps.smarthealthit.org/' },
    { name: 'SMART App Launcher by National Library of Medicine', url: 'https://lforms-smart-fhir.nlm.nih.gov/' }
  ]
};
