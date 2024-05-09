// REFACTOR(akhilmhdh): This file needs to be split into multiple components too complex

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { faFolderOpen } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowRight,
  faExclamationCircle,
  faMagnifyingGlass,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { createNotification } from "@app/components/notifications";
import { OrgPermissionCan } from "@app/components/permissions";
import onboardingCheck from "@app/components/utilities/checks/OnboardingCheck";
import {
  Button,
  Checkbox,
  FormControl,
  Input,
  Modal,
  ModalContent,
  Skeleton,
  UpgradePlanModal
} from "@app/components/v2";
import {
  OrgPermissionActions,
  OrgPermissionSubjects,
  useOrganization,
  useSubscription,
  useUser,
  useWorkspace
} from "@app/context";
import { withPermission } from "@app/hoc";
import {
  fetchOrgUsers,
  useAddUserToWsNonE2EE,
  useCreateWorkspace
} from "@app/hooks/api";
// import { fetchUserWsKey } from "@app/hooks/api/keys/queries";
import { useFetchServerStatus } from "@app/hooks/api/serverDetails";
import { usePopUp } from "@app/hooks/usePopUp";

const formSchema = yup.object({
  name: yup
    .string()
    .required()
    .label("Project Name")
    .trim()
    .max(64, "Too long, maximum length is 64 characters"),
  addMembers: yup.bool().required().label("Add Members")
});

type TAddProjectFormData = yup.InferType<typeof formSchema>;

// #TODO: Update all the workspaceIds

const OrganizationPage = withPermission(
  () => {
    const { t } = useTranslation();

    const router = useRouter();

    const { workspaces, isLoading: isWorkspaceLoading } = useWorkspace();
    const { currentOrg } = useOrganization();
    const routerOrgId = String(router.query.id);
    const orgWorkspaces = workspaces?.filter((workspace) => workspace.orgId === routerOrgId) || [];

    const addUsersToProject = useAddUserToWsNonE2EE();

    const { popUp, handlePopUpOpen, handlePopUpClose, handlePopUpToggle } = usePopUp([
      "addNewWs",
      "upgradePlan"
    ] as const);
    const {
      control,
      formState: { isSubmitting },
      reset,
      handleSubmit
    } = useForm<TAddProjectFormData>({
      resolver: yupResolver(formSchema)
    });

    const [, setHasUserClickedSlack] = useState(false);
    const [, setHasUserClickedIntro] = useState(false);
    const [, setHasUserPushedSecrets] = useState(false);
    const [, setUsersInOrg] = useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const createWs = useCreateWorkspace();
    const { user } = useUser();
    const { data: serverDetails } = useFetchServerStatus();

    const onCreateProject = async ({ name, addMembers }: TAddProjectFormData) => {
      // type check
      if (!currentOrg) return;
      if (!user) return;
      try {
        const {
          data: {
            project: { id: newProjectId }
          }
        } = await createWs.mutateAsync({
          projectName: name
        });

        if (addMembers) {
          const orgUsers = await fetchOrgUsers(currentOrg.id);

          await addUsersToProject.mutateAsync({
            usernames: orgUsers
              .map((member) => member.user.username)
              .filter((username) => username !== user.username),
            projectId: newProjectId
          });
        }

        // eslint-disable-next-line no-promise-executor-return -- We do this because the function returns too fast, which sometimes causes an error when the user is redirected.
        await new Promise((resolve) => setTimeout(resolve, 2_000));

        handlePopUpClose("addNewWs");
        createNotification({ text: "Workspace created", type: "success" });
        router.push(`/project/${newProjectId}/secrets/overview`);
      } catch (err) {
        console.error(err);
        createNotification({ text: "Failed to create workspace", type: "error" });
      }
    };

    const { subscription } = useSubscription();

    const isAddingProjectsAllowed = subscription?.workspaceLimit
      ? subscription.workspacesUsed < subscription.workspaceLimit
      : true;

    useEffect(() => {
      onboardingCheck({
        orgId: routerOrgId,
        setHasUserClickedIntro,
        setHasUserClickedSlack,
        setHasUserPushedSecrets,
        setUsersInOrg
      });
    }, []);

    const isWorkspaceEmpty = !isWorkspaceLoading && orgWorkspaces?.length === 0;

    return (
      <div className="mx-auto flex max-w-7xl flex-col justify-start bg-bunker-800 md:h-screen">
        <Head>
          <title>{t("common.head-title", { title: t("settings.members.title") })}</title>
          <link rel="icon" href="/infisical.ico" />
        </Head>
        {!serverDetails?.redisConfigured && (
          <div className="mb-4 flex flex-col items-start justify-start px-6 py-6 pb-0 text-3xl">
            <p className="mr-4 mb-4 font-semibold text-white">Announcements</p>
            <div className="flex w-full items-center rounded-md border border-blue-400/70 bg-blue-900/70 p-2 text-base text-mineshaft-100">
              <FontAwesomeIcon
                icon={faExclamationCircle}
                className="mr-4 p-4 text-2xl text-mineshaft-50"
              />
              Attention: Updated versions of Infisical now require Redis for full functionality.
              Learn how to configure it
              <Link
                href="https://infisical.com/docs/self-hosting/configuration/redis"
                target="_blank"
              >
                <span className="cursor-pointer pl-1 text-white underline underline-offset-2 duration-100 hover:text-blue-200 hover:decoration-blue-400">
                  here
                </span>
              </Link>
              .
            </div>
          </div>
        )}
        <div className="mb-4 flex flex-col items-start justify-start px-6 py-6 pb-0 text-3xl">
          <p className="mr-4 font-semibold text-white">Projects</p>
          <div className="mt-6 flex w-full flex-row">
            <Input
              className="h-[2.3rem] bg-mineshaft-800 text-sm placeholder-mineshaft-50 duration-200 focus:bg-mineshaft-700/80"
              placeholder="Search by project name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
            />
            <OrgPermissionCan I={OrgPermissionActions.Create} an={OrgPermissionSubjects.Workspace}>
              {(isAllowed) => (
                <Button
                  isDisabled={!isAllowed}
                  colorSchema="primary"
                  leftIcon={<FontAwesomeIcon icon={faPlus} />}
                  onClick={() => {
                    if (isAddingProjectsAllowed) {
                      handlePopUpOpen("addNewWs");
                    } else {
                      handlePopUpOpen("upgradePlan");
                    }
                  }}
                  className="ml-2"
                >
                  Add New Project
                </Button>
              )}
            </OrgPermissionCan>
          </div>
          <div className="mt-4 grid w-full grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {isWorkspaceLoading &&
              Array.apply(0, Array(3)).map((_x, i) => (
                <div
                  key={`workspace-cards-loading-${i + 1}`}
                  className="min-w-72 flex h-40 flex-col justify-between rounded-md border border-mineshaft-600 bg-mineshaft-800 p-4"
                >
                  <div className="mt-0 text-lg text-mineshaft-100">
                    <Skeleton className="w-3/4 bg-mineshaft-600" />
                  </div>
                  <div className="mt-0 pb-6 text-sm text-mineshaft-300">
                    <Skeleton className="w-1/2 bg-mineshaft-600" />
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="w-1/2 bg-mineshaft-600" />
                  </div>
                </div>
              ))}
            {orgWorkspaces
              .filter((ws) => ws?.name?.toLowerCase().includes(searchFilter.toLowerCase()))
              .map((workspace) => (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                <div
                  onClick={() => {
                    router.push(`/project/${workspace.id}/secrets/overview`);
                    localStorage.setItem("projectData.id", workspace.id);
                  }}
                  key={workspace.id}
                  className="min-w-72 group flex h-40 cursor-pointer flex-col justify-between rounded-md border border-mineshaft-600 bg-mineshaft-800 p-4"
                >
                  <div className="mt-0 truncate text-lg text-mineshaft-100">{workspace.name}</div>
                  <div className="mt-0 pb-6 text-sm text-mineshaft-300">
                    {workspace.environments?.length || 0} environments
                  </div>
                  <button type="button">
                    <div className="group ml-auto w-max cursor-pointer rounded-full border border-mineshaft-600 bg-mineshaft-900 py-2 px-4 text-sm text-mineshaft-300 transition-all group-hover:border-primary-500/80 group-hover:bg-primary-800/20 group-hover:text-mineshaft-200">
                      Explore{" "}
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="pl-1.5 pr-0.5 duration-200 group-hover:pl-2 group-hover:pr-0"
                      />
                    </div>
                  </button>
                </div>
              ))}
          </div>
          {isWorkspaceEmpty && (
            <div className="w-full rounded-md border border-mineshaft-700 bg-mineshaft-800 px-4 py-6 text-base text-mineshaft-300">
              <FontAwesomeIcon
                icon={faFolderOpen}
                className="mb-4 mt-2 w-full text-center text-5xl text-mineshaft-400"
              />
              <div className="text-center font-light">
                You are not part of any projects in this organization yet. When you are, they will
                appear here.
              </div>
              <div className="mt-0.5 text-center font-light">
                Create a new project, or ask other organization members to give you necessary
                permissions.
              </div>
            </div>
          )}
        </div>

        <Modal
          isOpen={popUp.addNewWs.isOpen}
          onOpenChange={(isModalOpen) => {
            handlePopUpToggle("addNewWs", isModalOpen);
            reset();
          }}
        >
          <ModalContent
            title="Create a new project"
            subTitle="This project will contain your secrets and configurations."
          >
            <form onSubmit={handleSubmit(onCreateProject)}>
              <Controller
                control={control}
                name="name"
                defaultValue=""
                render={({ field, fieldState: { error } }) => (
                  <FormControl
                    label="Project Name"
                    isError={Boolean(error)}
                    errorText={error?.message}
                  >
                    <Input {...field} placeholder="Type your project name" />
                  </FormControl>
                )}
              />
              <div className="mt-4 pl-1">
                <Controller
                  control={control}
                  name="addMembers"
                  defaultValue={false}
                  render={({ field: { onBlur, value, onChange } }) => (
                    <OrgPermissionCan
                      I={OrgPermissionActions.Read}
                      a={OrgPermissionSubjects.Member}
                    >
                      {(isAllowed) => (
                        <div>
                          <Checkbox
                            id="add-project-layout"
                            isChecked={value}
                            onCheckedChange={onChange}
                            isDisabled={!isAllowed}
                            onBlur={onBlur}
                          >
                            Add all members of my organization to this project
                          </Checkbox>
                        </div>
                      )}
                    </OrgPermissionCan>
                  )}
                />
              </div>
              <div className="mt-7 flex items-center">
                <Button
                  isDisabled={isSubmitting}
                  isLoading={isSubmitting}
                  key="layout-create-project-submit"
                  className="mr-4"
                  type="submit"
                >
                  Create Project
                </Button>
                <Button
                  key="layout-cancel-create-project"
                  onClick={() => handlePopUpClose("addNewWs")}
                  variant="plain"
                  colorSchema="secondary"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </ModalContent>
        </Modal>
        <UpgradePlanModal
          isOpen={popUp.upgradePlan.isOpen}
          onOpenChange={(isOpen) => handlePopUpToggle("upgradePlan", isOpen)}
          text="You have exceeded the number of projects allowed on the free plan."
        />
        {/* <DeleteUserDialog isOpen={isDeleteOpen} closeModal={closeDeleteModal} submitModal={deleteMembership} userIdToBeDeleted={userIdToBeDeleted}/> */}
      </div>
    );
  },
  {
    action: OrgPermissionActions.Read,
    subject: OrgPermissionSubjects.Workspace
  }
);

Object.assign(OrganizationPage, { requireAuth: true });

export default OrganizationPage;
