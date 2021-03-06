import React from "react";
import { toast, ToastContainer } from "react-toastify";
import { CardDeck, Spinner } from "react-bootstrap";
import { Translation } from 'react-i18next';
import i18n from '../i18n';

import PodStorageHandler from "../components/podService/podStoreHandler";
import RouteCard from "../components/routeList/RouteCard";
import MyRoute from "../model/MyRoute";
import $ from "jquery";

import 'react-toastify/dist/ReactToastify.css';
import RouteManager from "../model/RouteManager";

const auth = require('solid-auth-client');

class RouteList extends React.Component {

    constructor(props) {
        super(props);
        this.routeManager = RouteManager;
        this.cardDeckSize = 4;
        this.state = {
            routes: [],
            sharedRoutes: [],
            spinnerHidden: false,
        };
        if (props.sync === undefined || props.sync === true) { // avoid sync with pod, used for RouteList.test.js
            this.syncRoutesWithPod().then(() => {
                this.state.spinnerHidden = true;
            });
            this.processedRoutes = 0;
            this.retrievedRoutes = 0;
        }
    }

    render() {
        let routesForCardDecks = [];
        let counter = 0;
        while (counter <= this.state.routes.length) {
            routesForCardDecks.push(
                <CardDeck style={{ padding: "1% 0% 1% 2%", width: "100%" }}>
                    {this.state.routes.slice(counter, counter + this.cardDeckSize).map(
                        (r) => <RouteCard route={r} />
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
                <Translation>
                    {
                        (t) => <h1 style={{ padding: "1%" }}>{t('routeListText')}</h1>
                    }
                </Translation>
                <Translation>
                    {
                        (t) => <h2 style={{ padding: "1%" }} hidden={this.state.spinnerHidden}>{t('routeListLoadingMessage')}</h2>
                    }
                </Translation>

                <Spinner id={"spinner"} hidden={this.state.spinnerHidden} animation="border" />
                {routesForCardDecks}
                <div id="messageArea">
                    {this.state.message}
                </div>
            </div>
        );
    }

    async syncRoutesWithPod() {
        this.routeManager.resetRoutes();
        let session = await auth.currentSession();
        if (session !== null && session !== undefined) {
            let storageHandler = new PodStorageHandler(session);

            // Handle my Routes
            storageHandler.getRoutes((routeJson, error) => {
                if (routeJson === null) {
                    toast.error(i18n.t('alertAccessPOD'));
                    return 0;
                } else {
                    if (routeJson.length !== 0) {
                        let tempRoute = new MyRoute("", "", "", []);
                        if (tempRoute.modifyFromJsonLd(routeJson)) { //isValid
                            this.routeManager.addRoute(tempRoute);
                            let tempList = this.state.routes;
                            tempList.push(tempRoute);
                            this.processedRoutes += 1;
                            if (this.processedRoutes === this.retrievedRoutes) {
                                this.setState({ routes: tempList });
                                $("#messageArea").empty();
                            }
                        } else { //isinvalid
                            toast.error(i18n.t('invalidRoute'));
                            this.retrievedRoutes--;
                            if (this.processedRoutes === this.retrievedRoutes) {
                                this.setState({ routes: this.state.routes });
                                $("#messageArea").empty();
                            }
                        }
                    }
                    return this.processedRoutes;
                }
            }).then(
                (result) => {
                    if (result === 0) {
                        this.setState({
                            message:
                                <div>
                                    <h3>{i18n.t('routeListOoopsTitle')}</h3>
                                    <p>{i18n.t('routeListOoopsParagraph')}</p>
                                </div>
                        });
                    } else {
                        this.retrievedRoutes = result;
                    }

                }
            );
        }
    }



}

export default RouteList;