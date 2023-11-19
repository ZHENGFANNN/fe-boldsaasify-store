"use client";

import styles from "./index.module.scss";
import Empyt from "@/components/Empyt";
import ConfirmModal from "@/components/Modal/ConfirmModal";
import Api from "../../api";
import React from "react";
import Loading from "@/components/Loading";

import dynamic from "next/dynamic";
const NewAddressForm = dynamic(() => import("../NewAddressForm"), {
  ssr: false,
});

export default function AddressInfo({ showTip, LANG }) {
  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState([]);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const getList = React.useCallback(() => {
    setLoading(true);
    Api.getUserAddress()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setList(res.data.list);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    getList();
  }, []);

  return (
    <>
      {loading ? (
        <Loading height={400} />
      ) : (
        <div className={styles.contaier}>
          <div className={styles.title_container}>
            <div>
              <span>{LANG["www.account.shipping_address"]}</span>
            </div>
            <NewAddressForm LANG={LANG} onFinish={() => getList()} />
          </div>

          {list?.length > 0 ? (
            <div className={styles.list}>
              {list.map((item, index) => {
                return (
                  <div key={index} className={styles.item}>
                    <div className={styles.content}>
                      <div className={styles.user}>
                        <span>
                          {item.first_name}
                          {item.last_name}
                        </span>
                        <span>{`(${item.short_phone}) ${item.phone}`}</span>
                      </div>
                      <div className={styles.address}>
                        <div>{`${item.zip_code} ${item.area_text} ${item.address1}`}</div>
                        <div>{item.address2}</div>
                      </div>
                    </div>
                    <ConfirmModal
                      LANG={LANG}
                      title={LANG["www.account.shipping_address.tip"]}
                      content={LANG["www.account.shipping_address.delete_tip"]}
                      renderNode={
                        <div className={styles.icon_container}>
                          <img
                            alt="delete"
                            width={24}
                            height={24}
                            src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-utils-delete.svg`}
                          />
                        </div>
                      }
                      onOk={() => {
                        if (deleteLoading) return;
                        setDeleteLoading(true);
                        Api.deleteUserAddress({ id: item.id })
                          .then(() => {
                            showTip({
                              type: "success",
                              text: LANG[
                                "www.account.shipping_address.success_deleted"
                              ],
                            });
                            getList();
                            setDeleteLoading(false);
                          })
                          .catch(() => {
                            showTip({
                              type: "error",
                              text: LANG[
                                "www.account.shipping_address.fail_deleted"
                              ],
                            });
                            setDeleteLoading(false);
                          });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <Empyt />
          )}
        </div>
      )}
    </>
  );
}
