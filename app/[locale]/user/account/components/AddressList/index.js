"use client";

import styles from "./index.module.scss";
import Empyt from "../../../../../components/Empyt";
import ConfirmModal from "../../../../../components/Modal/ConfirmModal";
import Api from "../../api";
import React from "react";
import Loading from "../../../../../components/Loading";

import dynamic from "next/dynamic";
const NewAddressForm = dynamic(() => import("../NewAddressForm"), {
  ssr: false,
});

export default function AddressInfo({ showTip, LANG }) {
  const [loading, setLoading] = React.useState(true);
  const [list, setList] = React.useState([]);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  // 编辑弹窗受控态：editItem 为选中的地址，editOpen 控制显隐。
  const [editItem, setEditItem] = React.useState(null);
  const [editOpen, setEditOpen] = React.useState(false);
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
    // 首屏拉取地址列表；getList 内部 setState 属预期同步，豁免该规则。
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    getList();
  }, []);

  const openEdit = React.useCallback((item) => {
    setEditItem(item);
    setEditOpen(true);
  }, []);

  return (
    <>
      {loading ? (
        <Loading height={400} />
      ) : (
        <div className={styles.contaier}>
          <div className={styles.title_container}>
            <div>
              <span>{LANG["user_account.shipping_address"]}</span>
            </div>
            <NewAddressForm LANG={LANG} onFinish={() => getList()} />
          </div>

          {list?.length > 0 ? (
            <div className={styles.list}>
              {list.map((item, index) => {
                return (
                  <div key={index} className={styles.item}>
                    <div
                      className={styles.content}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEdit(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openEdit(item);
                        }
                      }}
                    >
                      <div className={styles.user}>
                        <span>
                          {item.first_name}
                          {item.last_name}
                        </span>
                        <span>{`(${item.short_phone}) ${item.phone}`}</span>
                      </div>
                      <div className={styles.address}>
                        <div>{`${item.zip_code} ${
                          item.state ? `${item.state} ` : ""
                        }${item.area_text} ${item.address1}`}</div>
                        <div>{item.address2}</div>
                      </div>
                    </div>
                    <ConfirmModal
                      LANG={LANG}
                      title={LANG["user_account.shipping_address.tip"]}
                      content={LANG["user_account.shipping_address.delete_tip"]}
                      renderNode={
                        <div className={styles.icon_container}>
                          <img
                            alt="delete"
                            width={24}
                            height={24}
                            src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-utils-delete.svg`}
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
                                "user_account.shipping_address.success_deleted"
                              ],
                            });
                            getList();
                            setDeleteLoading(false);
                          })
                          .catch(() => {
                            showTip({
                              type: "error",
                              text: LANG[
                                "user_account.shipping_address.fail_deleted"
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
            <Empyt LANG={LANG} />
          )}

          {/* 受控编辑弹窗：与新增复用同一表单，携带 editItem 回填 + id 提交 */}
          <NewAddressForm
            LANG={LANG}
            editItem={editItem}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onFinish={() => {
              setEditOpen(false);
              getList();
            }}
          />
        </div>
      )}
    </>
  );
}
