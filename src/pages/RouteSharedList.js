import React from "react";
import { CardDeck, Spinner } from "react-bootstrap";
import RouteCard from "../components/routeList/RouteCard";
import { toast, ToastContainer } from "react-toastify";
import PodStorageHandler from "../components/podService/podStoreHandler";
import Button from "react-bootstrap/Button";
import i18n from '../i18n';
import RouteManager from "../model/RouteManager";
import MyRoute from "../model/MyRoute";
import $ from "jquery";

const auth = require('solid-auth-client');

export default class RouteSharedList extends React.Component {

    constructor(props) {
        super(props);
        this.routeManager = RouteManager;
        this.cardDeckSize = 4;
        this.state = {
            sharedRoutes: [],
            spinnerHidden: false,
        };
        this.readInbox();
        if (props.sync === undefined || props.sync === true) { // avoid sync with pod, used for RouteList.test.js
            this.syncRoutesWithPod().then(() => {
                this.state.spinnerHidden = true;
            });
            this.retrievedRoutes = false;
        }
    }

    async readInbox() {
        new PodStorageHandler(await auth.currentSession()).checkInbox();
    }

    render() {
        let routesForCardDecks = [];
        let counter = 0;
        while (counter <= this.state.sharedRoutes.length) {
            routesForCardDecks.push(
                <CardDeck style={{ padding: "1% 0% 1% 2%", width: "100%" }}>
                    {this.state.sharedRoutes.slice(counter, counter + this.cardDeckSize).map(
                        (r) => { return <RouteCard route={r} showShareButton={false} />; }
                    )}
                </CardDeck>
            );
            counter += this.cardDeckSize;
        }

        return (
            <div>
                <ToastContainer
                    position={toast.POSITION.TOP_CENTER}
                    autoClose={5000}
                />
                <div id="title" style={{ display: "inline" }}>
                    <h1 style={{ margin: "2%", display: "inline" }}>{i18n.t('sharedRouteListTitle')}</h1>
                    <Button style={{ display: "inline", float: "right", margin: "2%" }} variant="danger" onClick={() => {

                        if (window.confirm("Are you sure?")) {
                            this.cleanSharedFolder();
                        }
                    }}>Clean files shared to you</Button>
                </div>

                <h2 style={{ padding: "1%" }} hidden={this.state.spinnerHidden}>{i18n.t('routeListLoadingMessage')}</h2>

                <Spinner id={"spinner"} hidden={this.state.spinnerHidden} animation="border" />
                {routesForCardDecks}
                <div id="messageArea">
                    {this.state.message}
                </div>
            </div>
        );
    }

    async cleanSharedFolder() {
        let session = await auth.currentSession();
        let storageHandler = new PodStorageHandler(session);
        storageHandler._eliminateSharedFolder();
        toast.success(i18n.t("alertRoutesRemoved"));
        this.syncRoutesWithPod();
    }

    async syncRoutesWithPod() {
        this.routeManager.resetRoutes();
        let session = await auth.currentSession();
        if (session !== null && session !== undefined) {
            let storageHandler = new PodStorageHandler(session);
            storageHandler.getRoutesSharedToMe((routeJson, error, lastProcessedFile) => {
                if (routeJson === null) {
                    toast.error(i18n.t("alertUnavailableRoutes"));
                } else {
                    if (routeJson.length !== 0) {
                        let tempRoute = new MyRoute("", "", "", []);
                        tempRoute.modifyFromJsonLd(routeJson);
                        this.routeManager.addSharedRoute(tempRoute);
                        let tempList = this.state.sharedRoutes;
                        tempList.push(tempRoute);
                        if (lastProcessedFile && !this.retrievedRoutes) {
                            this.setState({
                                sharedRoutes: tempList,
                                spinnerHidden: true
                            });
                            $("#messageArea").empty();
                        }
                    }
                }
            }).then(
                (found) => {
                    if (!found) {
                        this.setState({
                            message:
                                <div>
                                    <h3>{i18n.t('sharedRouteListOoopsTitle')}</h3>
                                    <p>{i18n.t('sharedRouteListOoopsParagraph')}</p>
                                </div>
                        });
                    } else {
                        this.retrievedRoutes = true;
                    }
                }
            );
        }
    }

}