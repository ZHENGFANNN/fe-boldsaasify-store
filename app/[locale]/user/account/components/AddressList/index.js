"use client";

import styles from "./index.module.scss";
import Api from "../../api";
import React from "react";
import Loading from "@/components/Loading";
import AddressBar from "@/components/Address/AddressBar";
import AddressFormModal from "@/components/Address/AddressFormModal";

// 账户中心的地址列表容器：负责拉取列表 + 删除，卡片渲染与「新增/编辑」交互
// 分别下发给 AddressBar 与 AddressFormModal（放在 app/components/Address 下复用）。
export default function AddressListSection({ showTip, LANG }) {
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

  const handleDelete = React.useCallback(
    (item) => {
      if (deleteLoading) return;
      setDeleteLoading(true);
      Api.deleteUserAddress({ id: item.id })
        .then(() => {
          showTip({
            type: "success",
            text: LANG["user_account.shipping_address.success_deleted"],
          });
          getList();
          setDeleteLoading(false);
        })
        .catch(() => {
          showTip({
            type: "error",
            text: LANG["user_account.shipping_address.fail_deleted"],
          });
          setDeleteLoading(false);
        });
    },
    [deleteLoading, showTip, LANG, getList]
  );

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
            <AddressFormModal
              LANG={LANG}
              apiSave={Api.saveUserAddress}
              apiParse={Api.parseAddress}
              apiAutocomplete={Api.placeAutocomplete}
              apiDetail={Api.placeDetail}
              onFinish={() => getList()}
            />
          </div>

          <AddressBar
            LANG={LANG}
            list={list}
            onEdit={openEdit}
            onDelete={handleDelete}
            deleteLoading={deleteLoading}
            autoSelectFirst={false}
          />

          {/* 受控编辑弹窗：与新增复用同一表单，携带 editItem 回填 + id 提交 */}
          <AddressFormModal
            LANG={LANG}
            apiSave={Api.saveUserAddress}
            apiParse={Api.parseAddress}
            apiAutocomplete={Api.placeAutocomplete}
            apiDetail={Api.placeDetail}
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
