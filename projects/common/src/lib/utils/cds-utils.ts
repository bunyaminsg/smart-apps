import {Signal} from "@angular/core";
import {FhirUtils} from "./fhir-utils";

export class CdsUtils {
  public static stateToPrefetch(state: any, conceptDefinitions: { id: string, value: Signal<any>, [key: string]: any }[], patient: fhir4.Patient, includePatient?: boolean) {
    const prefetch: any = {}
    Object.entries(state).map(([conceptId, value]) => {
      prefetch[conceptId] = FhirUtils.createBundle(
        <any>conceptDefinitions.find(_ => _.id === conceptId),
        <any>patient,
        <any>value);
    })
    if (includePatient) {
      prefetch.patient = patient
    }
    return prefetch
  }

  public static applySuggestionsUtil(result: any , serviceId: string) {
    const state = result.statefulCdsService.getState(result.Service.conceptDefinitions)
    const prefetch = CdsUtils.stateToPrefetch(state, result.Service.conceptDefinitions, <fhir4.Patient>result.getPatient(), true)
    result.suggestions.forEach((card: { suggestions: any[]; }) => card.suggestions.forEach((suggestion: any) => {
      if (suggestion.apply) {
        const resource: fhir4.Observation = suggestion.actions[0].resource
        const definition = result.Service.conceptDefinitions.find((_definition: any) =>
          _definition.code?.code === resource.code?.coding?.at(0)?.code)
        if (definition && prefetch[definition.id]) {
          prefetch[definition.id].total += 1
          prefetch[definition.id].entry.splice(0, 1, {
            resource: resource,
            search: {
              mode: 'match'
            }
          })
        }
      }
    }))
    result.statefulCdsService.callService({
      serviceId: serviceId,
      language: 'en',
      client: result.getClient(),
      patient: result.getPatient()
    }, {
      prefetch,
      context: {
        patientId: result.getPatient()?.id
      }
        }).then((response: any) => result.handleServiceResponse(response, false), (error: any) => result.handleServiceError(error))
  }

}
