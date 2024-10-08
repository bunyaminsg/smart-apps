import {Component, Injector, OnDestroy, OnInit} from '@angular/core';
import {CdsDataService,CdsUtils, StatefulCdsService} from "common"
import {SmartOnFhirService} from "smart-on-fhir"
import Client from "fhirclient/lib/Client";
import {Subject} from "rxjs";
import * as FHIR from "fhirclient";

@Component({
  selector: 'qrisk3-results',
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent implements OnInit, OnDestroy {
  loadingPatientData: boolean = false;
  private client: Client|undefined;
  private patient: fhir4.Patient|undefined;
  private destroy$: Subject<void> = new Subject();
  valid = false
  initialScores: any[] = [];
  scores: any[] = [];
  error: any;
  suggestions: any[] = [];

  constructor(public qrisk3Service: CdsDataService, private sof: SmartOnFhirService, private injector: Injector,
              private statefulCdsService: StatefulCdsService) {
  }

  async ngOnInit() {
    this.loadingPatientData = true
    this.client = await FHIR.oauth2.ready()
    this.patient = await this.sof.getPatient()
    await this.qrisk3Service.init(this.client, this.patient, 'qrisk3')
    this.loadingPatientData = false
    this.qrisk3Service.onPrefetchStateChange({
      callService: true,
      transformState: (state) => {
        this.scores = []
        this.error = undefined
        return {
          context: {
            patientId: this.patient?.id
          },
          prefetch: CdsUtils.stateToPrefetch(state, this.qrisk3Service.conceptDefinitions, <fhir4.Patient>this.patient, true)
        }
      },
      handleServiceResponse: (response) => {
        this.handleServiceResponse(response, true)
      },
      handleServiceError: (err) => {
        this.handleServiceError(err)
      },
      injector: this.injector,
      takeUntil: this.destroy$
    })
  }

  ngOnDestroy() {
    this.destroy$.next()
  }

  applySuggestions() {
    const state = this.statefulCdsService.getState(this.qrisk3Service.conceptDefinitions)
    const tmpPrefetch = CdsUtils.stateToPrefetch(state, this.qrisk3Service.conceptDefinitions, <fhir4.Patient>this.patient, true)
    const prefetch = CdsUtils.applySuggestions(tmpPrefetch, this.suggestions, this.qrisk3Service.conceptDefinitions)
    this.statefulCdsService.callService({
      serviceId: 'qrisk3',
      language: 'en',
      client: this.client,
      patient: this.patient
    }, {
      prefetch,
      context: {
        patientId: this.patient?.id
      }
    }).then(response => this.handleServiceResponse(response, false), error => this.handleServiceError(error))
  }

  private handleServiceResponse(response: any, updateSuggestions: boolean) {
    try {
      const qrisk3Card = response.cards.find((card: any) => card.uuid === 'CVD CARD SCORE')
      const qrisk3Obs = <fhir4.Observation>qrisk3Card.suggestions[0].actions[0].resource;
      if (updateSuggestions) {
        this.suggestions = response.cards.filter((card: any) => card !== qrisk3Card)
      }
      this.scores = [Math.floor((qrisk3Obs?.valueQuantity?.value || 0) * 100) / 100,
        Math.floor((qrisk3Obs?.referenceRange?.at(0)?.high?.value || 0) * 100) / 100]
      if (!this.initialScores.length) {
        this.initialScores = this.scores
      }
    } catch (err) {
      if (!response?.cards?.length) {
        this.error = 'QRISK3 cannot be calculated. Make sure all required inputs are provided.'
      }
    }
  }

  private handleServiceError(err: any) {
    console.error(err);
    this.error = err?.message || err?.toString() || 'Unknown error';
  }
}
