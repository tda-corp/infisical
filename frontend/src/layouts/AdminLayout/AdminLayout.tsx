/* eslint-disable no-nested-ternary */
/* eslint-disable no-unexpected-multiline */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable func-names */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  faArrowLeft,
  faInfo,
  faMobile,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@app/components/v2";
import { useOrganization, useSubscription, useUser } from "@app/context";
import {
  useLogoutUser
} from "@app/hooks/api";

interface LayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: LayoutProps) => {
  const router = useRouter();

  // eslint-disable-next-line prefer-const
  const { currentOrg } = useOrganization();

  const { user } = useUser();
  const { subscription } = useSubscription();
  const infisicalPlatformVersion = process.env.NEXT_PUBLIC_INFISICAL_PLATFORM_VERSION;

  const { t } = useTranslation();

  const logout = useLogoutUser();
  const logOutUser = async () => {
    try {
      console.log("Logging out...");
      await logout.mutateAsync();
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="dark hidden h-screen w-full flex-col overflow-x-hidden md:flex">
        <div className="flex flex-grow flex-col overflow-y-hidden md:flex-row">
          <aside className="dark w-full border-r border-mineshaft-600 bg-gradient-to-tr from-mineshaft-700 via-mineshaft-800 to-mineshaft-900 md:w-60">
            <nav className="items-between flex h-full flex-col justify-between overflow-y-auto dark:[color-scheme:dark]">
              <div>
                {!router.asPath.includes("personal") && (
                  <div className="flex h-12 cursor-default items-center justify-between px-3 pt-6">
                    <Link href={`/org/${currentOrg?.id}/overview`}>
                      <div className="my-6 flex cursor-default items-center justify-center pr-2 text-sm text-mineshaft-300 hover:text-mineshaft-100">
                        <FontAwesomeIcon icon={faArrowLeft} className="pr-3" />
                        Back to organization
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        className="p-1 hover:bg-primary-400 hover:text-black data-[state=open]:bg-primary-400 data-[state=open]:text-black"
                      >
                        <div
                          className="child flex items-center justify-center rounded-full bg-mineshaft pr-1 text-mineshaft-300 hover:bg-mineshaft-500"
                          style={{ fontSize: "11px", width: "26px", height: "26px" }}
                        >
                          {user?.firstName?.charAt(0)}
                          {user?.lastName && user?.lastName?.charAt(0)}
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="p-1">
                        <div className="px-2 py-1 text-xs text-mineshaft-400">{user?.username}</div>
                        <Link href="/personal-settings">
                          <DropdownMenuItem>Personal Settings</DropdownMenuItem>
                        </Link>
                        {user?.superAdmin && (
                          <Link href="/admin" legacyBehavior>
                            <DropdownMenuItem className="mt-1 border-t border-mineshaft-600">
                              Admin Panel
                            </DropdownMenuItem>
                          </Link>
                        )}
                        <div className="mt-1 h-1 border-t border-mineshaft-600" />
                        <button type="button" onClick={logOutUser} className="w-full">
                          <DropdownMenuItem>Log Out</DropdownMenuItem>
                        </button>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
              <div
                className={`relative mt-10 ${
                  subscription && subscription.slug === "starter" && !subscription.has_used_trial
                    ? "mb-2"
                    : "mb-4"
                } flex w-full cursor-default flex-col items-center px-3 text-sm text-mineshaft-400`}
              >
                {router.asPath.includes("org") && (
                  <div
                    onKeyDown={() => null}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/org/${router.query.id}/members?action=invite`)}
                    className="w-full"
                  >
                    <div className="mb-3 w-full pl-5 duration-200 hover:text-mineshaft-200">
                      <FontAwesomeIcon icon={faPlus} className="mr-3" />
                      Invite people
                    </div>
                  </div>
                )}
                {infisicalPlatformVersion && (
                  <div className="mb-2 w-full pl-5 duration-200 hover:text-mineshaft-200">
                    <FontAwesomeIcon icon={faInfo} className="mr-4 px-[0.1rem]" />
                    Version: {infisicalPlatformVersion}
                  </div>
                )}
              </div>
            </nav>
          </aside>
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-bunker-800 dark:[color-scheme:dark]">
            {children}
          </main>
        </div>
      </div>
      <div className="z-[200] flex h-screen w-screen flex-col items-center justify-center bg-bunker-800 md:hidden">
        <FontAwesomeIcon icon={faMobile} className="mb-8 text-7xl text-gray-300" />
        <p className="max-w-sm px-6 text-center text-lg text-gray-200">
          {` ${t("common.no-mobile")} `}
        </p>
      </div>
    </>
  );
};
