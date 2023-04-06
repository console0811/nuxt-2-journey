<template>
  <v-row no-gutters class="pa-4">
    <v-col cols="12">
      <v-card outlined width="100%">
        <v-row no-gutters class="pa-8">
          <v-col cols="12">
            <span class="font-weight-bold">Course:</span>
            {{ scholarship.course }}
          </v-col>
          <v-col cols="12" class="mt-2">
            <span class="font-weight-bold">Date Published:</span>
            {{ new Date(scholarship.date).toLocaleDateString() }}
          </v-col>
          <v-col cols="12" class="mt-2">
            <span class="font-weight-bold">Cut-off:</span>
            {{ new Date(scholarship.cutOff).toLocaleDateString() }}
          </v-col>
          <v-col cols="12" class="mt-2">
            <span class="font-weight-bold">Slots:</span>
            {{ scholarship.applicants || 0 }}/{{ scholarship.limit }}
          </v-col>
          <v-col cols="12" class="mt-2">
            <span class="font-weight-bold">Descriptions:</span>
            {{ scholarship.descriptions }}
          </v-col>

          <v-col cols="12" class="mt-2">
            <span class="font-weight-bold">Qualifications:</span>
            {{ scholarship.qualifications }}
          </v-col>

          <v-col cols="12" class="mt-2">
            <span class="font-weight-bold">Requirements:</span>
            {{ scholarship.requirements }}
          </v-col>

          <v-col cols="12" class="mt-2">
            <span class="font-weight-bold">Responsibilities:</span>
            {{ scholarship.responsibilities }}
          </v-col>

          <v-col cols="12" class="mt-2" v-if="$auth.user.type == 'applicant'">
            <span class="font-weight-bold">Status:</span>
            {{
              hasPending
                ? "Pending"
                : approvedApplication._id
                ? "Approved"
                : disapprovedApplication.date > elimination.date
                ? "Disapproved"
                : elimination._id
                ? "Eliminated"
                : ""
            }}
          </v-col>

          <v-col
            cols="12"
            lg="2"
            md="2"
            sm="3"
            class="mt-4"
            v-if="$auth.user.type == 'applicant'"
          >
            <v-btn
              color="primary"
              block
              :disabled="
                scholarship.applicants == scholarship.limit ||
                !!approvedApplication._id
              "
              @click="setApplicant({ dialog: true })"
            >
              Apply
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-col>

    <v-col cols="12" class="my-4" v-if="$auth.user.type == 'sponsor'">
      <v-tabs v-model="status">
        <template v-for="status in statuses">
          <v-tab :key="status.value">{{ status.text }}</v-tab>
        </template>
      </v-tabs>
    </v-col>

    <template v-for="applicant in applicants">
      <v-col
        cols="12"
        v-if="
          selectedTab.value == applicant.status && $auth.user.type == 'sponsor'
        "
        :key="applicant.status"
      >
        <v-card outlined width="100%">
          <v-row no-gutters>
            <v-col cols="12" class="pa-4">
              <v-row no-gutters>
                <v-col cols="6">
                  <v-row no-gutters class="fill-height" align="center">
                    {{ applicant.text }}
                  </v-row>
                </v-col>
                <v-col cols="6">
                  <InputTextField
                    v-model="search"
                    label="search"
                    @keyup.enter="searchApplicant()"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <v-divider></v-divider>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headers"
                fixed-header
                :items="applicant.items"
              >
                <template v-slot:[`item.date`]="{ item }">
                  {{ new Date(item.date).toLocaleString() }}
                </template>

                <template v-slot:[`item.applicantName`]="{ item }">
                  {{ item.applicantName[0] }} {{ item.applicantName[2] }}
                </template>

                <template v-slot:[`item.actions`]="{ item }">
                  <v-btn
                    dense
                    class="outline black--text yellow accent-4 text-capitalize"
                    elevation="2"
                    small
                    @click="setApplicant({ value: item, dialog: true })"
                  >
                    view
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </template>

    <v-dialog v-model="applicantDialog" width="100%" persistent>
      <v-form v-model="applicantValid" @submit.prevent="() => {}">
        <!-- header -->
        <v-card tile height="5vh">
          <v-row no-gutters class="fill-height" justify="center" align="center">
            <span class="text-capitalize font-weight-medium">
              Review Application
            </span>
          </v-row>
        </v-card>
        <!-- content -->
        <v-card tile height="79vh" style="overflow: auto" class="pa-0">
          <v-row no-gutters class="pa-8" justify="center">
            <v-col cols="12" lg="6" md="6">
              <UserInput :value="user" :type="user.type" readonly>
                <template v-slot:attachment>
                  <v-file-input
                    v-model="applicantAttachments"
                    accept="application/pdf"
                    label="Attachments"
                    dense
                    outlined
                    :rules="
                      applicant.requirements
                        ? [
                            (v) => (v && !!v.length) || 'Required',
                            $rules.limitAttachmentTo10,
                          ]
                        : []
                    "
                    :hint="applicant.requirements ? 'Required' : 'Optional'"
                    persistent-hint
                    multiple
                    v-if="$auth.user.type == 'applicant'"
                  ></v-file-input>

                  <v-row no-gutters v-else>
                    <v-col cols="12" class="text-capitalize">
                      Attachments
                    </v-col>
                    <template
                      v-for="(
                        attachment, attachmentIndex
                      ) in applicant.attachments"
                    >
                      <v-col
                        cols="12"
                        :key="attachmentIndex"
                        class="text-truncate pl-2"
                      >
                        <v-row
                          no-gutters
                          class="fill-height"
                          align-content="center"
                        >
                          <span
                            class="d-inline-block text-truncate text-caption underline-on-hover text-decoration-underline"
                            style="max-width: 300px"
                            @click="
                              setPdf({
                                src: attachment,
                                title: 'Attachment',
                                dialog: true,
                              })
                            "
                          >
                            attachment-{{ attachmentIndex + 1 }}
                          </span>
                        </v-row>
                      </v-col>
                    </template>
                  </v-row>
                </template>
              </UserInput>
            </v-col>
          </v-row>
        </v-card>
        <v-card tile max-height="6vh">
          <v-row no-gutters justify="center">
            <v-col cols="12" lg="2" md="2" sm="3" class="pa-2">
              <v-btn block small @click="setApplicant()">{{
                $auth.user.type == "sponsor" ? "close" : "cancel"
              }}</v-btn>
            </v-col>

            <v-col
              cols="12"
              lg="2"
              md="2"
              sm="3"
              class="pa-2"
              v-if="
                applicant.status == 'pending' && $auth.user.type == 'sponsor'
              "
            >
              <v-btn
                block
                small
                @click="
                  updateApplicant({
                    data: { _id: applicant._id, status: 'approved' },
                    folder: 'pending',
                  })
                "
                :disabled="!applicantValid"
              >
                Approve
              </v-btn>
            </v-col>

            <v-col
              cols="12"
              lg="2"
              md="2"
              sm="3"
              class="pa-2"
              v-if="
                applicant.status == 'pending' && $auth.user.type == 'sponsor'
              "
            >
              <v-btn
                block
                small
                @click="
                  updateApplicant({
                    data: { _id: applicant._id, status: 'disapproved' },
                    folder: 'pending',
                  })
                "
                :disabled="!applicantValid"
              >
                Disapprove
              </v-btn>
            </v-col>

            <v-col
              cols="12"
              lg="2"
              md="2"
              sm="3"
              class="pa-2"
              v-if="
                applicant.status == 'approved' && $auth.user.type == 'sponsor'
              "
            >
              <v-btn
                block
                small
                @click="
                  updateApplicant({
                    data: { _id: applicant._id, status: 'eliminated' },
                    folder: 'approved',
                  })
                "
                :disabled="!applicantValid"
              >
                Eliminate
              </v-btn>
            </v-col>

            <v-col
              cols="12"
              lg="2"
              md="2"
              sm="3"
              class="pa-2"
              v-if="$auth.user.type == 'applicant'"
            >
              <v-btn
                block
                small
                @click="
                  applyForScholarship({
                    attachments: applicantAttachments,
                  })
                "
                :disabled="!applicantValid"
              >
                Submit
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-form>
    </v-dialog>

    <pdf-preview v-model="attachmentDialog" :src="attachment" :title="title">
      <template v-slot:footer>
        <v-row no-gutters justify="center" class="pa-2">
          <v-col cols="12" lg="2" md="2" sm="3">
            <v-btn block small @click="setPdf()">close</v-btn>
          </v-col>
        </v-row>
      </template>
    </pdf-preview>
  </v-row>
</template>

<script>
import ApplicationModel from "~/models/model.application";
import ScholarshipModel from "~/models/model.scholarship";
import UserModel from "~/models/model.user";
import util from "~/plugins/util";
export default {
  mixins: [util],
  data() {
    return {
      scholarship: new ScholarshipModel(),
      user: new UserModel(),
      applicant: new ApplicationModel(),
      applicantDialog: false,
      applicantValid: false,
      applicantProfile: null,
      applicantAttachments: [],
      applications: [],
      applicants: [
        {
          text: "Applicants",
          status: "pending",
          items: [],
          length: 0,
        },
        {
          text: "Scholars",
          status: "approved",
          items: [],
          length: 0,
        },
        {
          text: "Declined Applicants",
          status: "disapproved",
          items: [],
          length: 0,
        },
        {
          text: "Eliminated",
          status: "eliminated",
          items: [],
          length: 0,
        },
      ],
      status: 0,
      search: "",
      statuses: [
        {
          text: "Applicants",
          value: "pending",
        },
        {
          text: "Scholars",
          value: "approved",
        },
        {
          text: "Declined Applicants",
          value: "disapproved",
        },
        {
          text: "Eliminated",
          value: "eliminated",
        },
      ],
      attachment: "",
      title: "",
      attachmentDialog: false,
    };
  },

  async mounted() {
    this.getScholarship(this.$route.params.id);
    this.getApplicationByScholarshipApplicantId({
      scholarship: this.$route.params.id,
      applicant: this.$auth.user._id,
    });

    const { items, length } = await this.getApplicantByScholarshipStatus({
      id: this.$route.params.id,
      status: "pending",
    });

    this.applicants[0].items = items;
    this.applicants[0].length = length;
  },

  methods: {
    setPdf({ src = "", title = "", dialog = false } = {}) {
      this.attachment = src;
      this.title = title;
      this.attachmentDialog = dialog;
    },
    applyForScholarship({
      applicant = this.$auth.user._id,
      scholarship = this.$route.params.id,
      attachments = [],
    }) {
      const json = JSON.stringify(
        new ApplicationModel({ applicant, scholarship })
      );
      const blob = new Blob([json], { type: "application/json" });
      const data = new FormData();
      data.append("user", blob);
      for (const attachment of attachments) {
        data.append("file", attachment);
      }

      this.$axios
        .$post("/applicant/create", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(({ message }) => {
          this.$store.dispatch("setNotificationProperty", {
            value: message,
            property: "text",
          });
          this.$store.dispatch("setNotificationProperty", {
            value: true,
            property: "value",
          });
          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });

          this.getScholarship(this.scholarship._id);
          this.getApplicationByScholarshipApplicantId({
            scholarship: this.$route.params.id,
            applicant: this.$auth.user._id,
          });
          this.setApplicant();
        })
        .catch((error) => {
          this.$store.dispatch("setNotificationProperty", {
            value: error.response.data.error,
            property: "text",
          });
          this.$store.dispatch("setNotificationProperty", {
            value: true,
            property: "value",
          });
          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });
        });
    },
    getScholarship(id = "") {
      this.$axios
        .$get(`/scholarship/${id}`)
        .then(({ data }) => {
          this.scholarship = data;
        })
        .catch((error) => {});
    },
    getApplicantByScholarshipStatus({
      id = "",
      status = "",
      search = this.search,
    } = {}) {
      return this.$axios
        .$get(`/applicant/${id}/${status}?search=${search}`)
        .then((data) => {
          return data;
        })
        .catch((error) => {
          console.log(error);
          return {
            items: [],
            length: 0,
          };
        });
    },
    updateApplicant({ data = new ApplicationModel(), folder = "" } = {}) {
      this.$store.dispatch("setLoadingProperty", {
        value: true,
        property: "value",
      });
      return this.$axios
        .$put("/applicant", { data })
        .then(async ({ message }) => {
          this.$store.dispatch("setNotificationProperty", {
            value: message,
            property: "text",
          });
          this.$store.dispatch("setNotificationProperty", {
            value: true,
            property: "value",
          });

          await this.getScholarship(this.scholarship._id);

          this.selectedApplicant.items =
            await this.getApplicantByScholarshipStatus({
              id: this.$route.params.id,
              status: folder,
            });

          await this.setApplicant();

          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });
        })
        .catch((error) => {
          this.$store.dispatch("setNotificationProperty", {
            value: error.response.data.error,
            property: "text",
          });
          this.$store.dispatch("setNotificationProperty", {
            value: true,
            property: "value",
          });
          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });
        });
    },

    async setApplicant({
      value = new ApplicationModel(),
      dialog = false,
    } = {}) {
      this.user = dialog
        ? await this.getUser(value.applicant)
        : new UserModel();
      this.applicant = value;
      this.applicantDialog = dialog;
    },

    getUser(id = "") {
      this.$store.dispatch("setLoadingProperty", {
        value: true,
        property: "value",
      });
      return this.$axios
        .$get(`/user/${id}`)
        .then(({ user }) => {
          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });
          return user;
        })
        .catch((error) => {
          this.$store.dispatch("setNotificationProperty", {
            value: error.response.data.error,
            property: "text",
          });

          this.$store.dispatch("setNotificationProperty", {
            value: true,
            property: "value",
          });

          this.$store.dispatch("setLoadingProperty", {
            value: false,
            property: "value",
          });

          return new UserModel();
        });
    },

    tableActions({ folder = "" } = {}) {
      let actions = [];

      let action = {};
      action.text = "View";
      action.handler = async ({ applicant = new ApplicationModel() } = {}) => {
        this.setApplicant({ value: applicant, dialog: true });
      };
      action.disabled = this.$auth.user.type !== "sponsor";

      actions.push(action);

      if (folder == "approved") {
        let action = {};
        action.text = "Eliminate";
        action.handler = async ({
          applicant = new ApplicationModel(),
        } = {}) => {
          await this.updateApplicant({
            data: {
              _id: applicant._id,
              status: "eliminated",
            },
            folder,
          });
        };
        action.disabled = this.$auth.user.type !== "sponsor";
        actions.push(action);
      }

      return actions;
    },

    getApplicationByScholarshipApplicantId({
      scholarship = "",
      applicant = "",
    } = {}) {
      this.$axios
        .$get(`/applicant/scholarship/${scholarship}/applicant/${applicant}`)
        .then(({ data }) => {
          this.applications = data;
        })
        .catch((err) => console.log(err));
    },

    async searchApplicant() {
      const { items, length } = await this.getApplicantByScholarshipStatus({
        id: this.$route.params.id,
        status: this.selectedTab.value,
      });

      this.selectedApplicant.items = items;
      this.selectedApplicant.length = length;
    },
  },

  computed: {
    hasPending() {
      return !!this.applications.filter((i) => i.status == "pending").length;
    },
    approvedApplication() {
      const items = this.applications
        .filter((i) => i.status == "approved")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      return items[0] || new ApplicationModel();
    },
    disapprovedApplication() {
      const items = this.applications
        .filter((i) => i.status == "disapproved")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      return items[0] || new ApplicationModel();
    },
    elimination() {
      const items = this.applications
        .filter((i) => i.status == "eliminated")
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      return items[0] || new ApplicationModel();
    },
    selectedTab() {
      return this.statuses[this.status];
    },
    selectedApplicant() {
      return this.applicants.find((i) => i.status == this.selectedTab.value);
    },
    headers() {
      let items = [
        {
          text: "date",
          value: "date",
        },
        {
          text: "name",
          value: "applicantName",
        },
        {
          text: "",
          value: "actions",
          width: "1%",
        },
      ];

      items = items.map((i) => ({
        ...i,
        class: "text-capitalize",
        sortable: false,
      }));
      return items;
    },
  },

  watch: {
    async selectedTab(status) {
      if (status) {
        const index = this.applicants.findIndex(
          (i) => i.status == status.value
        );
        const { items, length } = await this.getApplicantByScholarshipStatus({
          id: this.$route.params.id,
          status: status.value,
        });
        this.applicants[index].items = items;
        this.applicants[index].length = length;
      }
    },
  },
};
</script>

<style scoped>
* >>> .v-data-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}
* >>> .v-data-footer__select {
  display: none !important;
}
</style>